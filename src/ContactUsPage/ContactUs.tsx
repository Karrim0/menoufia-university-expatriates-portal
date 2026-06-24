import React, { useEffect, useState } from "react";
import {
  Phone,
  Mail,
  MapPin,
  Star,
  UploadCloud,
  ChevronDown,
  Search,
  Check,
} from "lucide-react";
import "./ContactUs.css";
import { useTranslation } from "react-i18next";
import api from "../Services/api";
import newsService from "../Services/newsService";
import { toast } from "react-toastify";

const COMPLAINT_CATEGORIES = {
  SPECIAL_UNITS: 1,
  DEPARTMENTS: 2,
  FACULTIES: 3,
};

const EXTERNAL_COMPLAINTS_URL = "https://www.shakwa.eg/GCP/Default.aspx";

const getSavedLang = () => {
  try {
    return JSON.parse(localStorage.getItem("lang") || "{}");
  } catch {
    return {};
  }
};

const normalizeApiResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.result)) return data.data.result;

  return [];
};

const getApiFac = (item) => {
  const possibleCodes = [
    item?.fac,
    item?.Fac,
    item?.publicCode,
    item?.PublicCode,
    item?.facCode,
    item?.facultyCode,
    item?.code,
  ];

  for (const possibleCode of possibleCodes) {
    const numericCode = Number(possibleCode);

    if (Number.isFinite(numericCode) && numericCode > 0) {
      return numericCode;
    }
  }

  return null;
};

function ContactUs(props) {
 const savedLang = getSavedLang();
const { t, i18n } = useTranslation("Contact");

const currentLangCode =
  String(i18n.language || savedLang?.code || "ar")
    .trim()
    .toLowerCase()
    .split("-")[0];

const isRTL = currentLangCode === "ar" || currentLangCode === "fa";
const isArabic = currentLangCode === "ar";
  

  const tx = (key, fallback, options = {}) => {
    return t(key, {
      defaultValue: fallback,
      ...options,
    });
  };

  const [activeTab, setActiveTab] = useState(
    props.currentTap || "suggestions",
  );

  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState(0);
  const [emailError, setEmailError] = useState("");

  const [complaintData, setComplaintData] = useState({
    fullName: "",
    email: "",
    phone: "",
    categoryId: "",
    facultyCode: "",
    messageText: "",
    attachments: [],
  });

  const [facultySearch, setFacultySearch] = useState("");
  const [isFacultyDropdownOpen, setIsFacultyDropdownOpen] = useState(false);
  const [attachmentInputKey, setAttachmentInputKey] = useState(0);

  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const pArStyle = {
    fontFamily: "var(--MNF_Body_AR)",
    fontSize: "14px",
  };

  const pEnStyle = {
    fontFamily: "var(--MNF_Body_EN)",
  };

  const tabs = [
    { id: "suggestions", label: tx("suggestions", "الاقتراحات") },
    { id: "complaints", label: tx("complaints", "الشكاوى") },
    {
  id: "externalComplaints",
  label: tx("government-complaints", "الشكاوى الحكومية"),
  externalUrl: EXTERNAL_COMPLAINTS_URL,
},
    { id: "ratings", label: tx("ratings", "التقييمات") },
  ];

  const selectedCategoryId = Number(complaintData.categoryId);
  const isFacultyComplaint =
    selectedCategoryId === COMPLAINT_CATEGORIES.FACULTIES;

  const validateEmail = (value) => {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(value);
  };

  useEffect(() => {
    const fetchColleges = async () => {
      if (activeTab !== "complaints" || !isFacultyComplaint) return;

      setCollegesLoading(true);

      try {
        const langId = Number(savedLang?.id) || 1;
        const response = await newsService.getColleges(langId);
        const data = normalizeApiResponse(response);

        const mappedColleges = data
          .map((item, index) => {
            const title = String(item?.title || "").trim();
            const fac = getApiFac(item);

            if (!title || !fac) return null;

            return {
              id: Number(item?.id || index),
              title,
              fac,
              order: Number(item?.order || 0),
            };
          })
          .filter(Boolean)
          .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

        setColleges(mappedColleges);
      } catch (error) {
        console.error("Failed to fetch colleges:", error);
        setColleges([]);

        toast.error(
          tx("faculties-load-failed", "تعذر تحميل قائمة الكليات"),
        );
      } finally {
        setCollegesLoading(false);
      }
    };

    fetchColleges();
  }, [activeTab, isFacultyComplaint, savedLang?.id, isArabic]);

  const resetSubmissionState = () => {
    setSubmitted(false);
    setSubmitMessage("");
    setEmailError("");
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    resetSubmissionState();
  };

  const handleEmailChange = (e) => {
    const emailValue = e.target.value;
    setEmail(emailValue);

    if (emailValue && !validateEmail(emailValue)) {
      setEmailError(tx("invalid-email", "البريد الإلكتروني غير صحيح"));
    } else {
      setEmailError("");
    }
  };

  const handleMessageChange = (e) => {
    setDescription(e.target.value);
  };

  const handleRatingChange = (rating) => {
    setRate(rating);
  };

  const handleComplaintChange = (e) => {
    const { name, value } = e.target;

    setComplaintData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "categoryId" ? { facultyCode: "" } : {}),
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setComplaintData((prev) => ({
      ...prev,
      categoryId: String(categoryId),
      facultyCode: "",
    }));

    setFacultySearch("");
    setIsFacultyDropdownOpen(false);
  };

  const handleFacultySelect = (facultyCode) => {
    setComplaintData((prev) => ({
      ...prev,
      facultyCode: String(facultyCode),
    }));

    setFacultySearch("");
    setIsFacultyDropdownOpen(false);
  };

  const handleAttachmentsChange = (e) => {
    const files = Array.from(e.target.files || []);

    setComplaintData((prev) => ({
      ...prev,
      attachments: files,
    }));
  };

  const getMessageType = () => {
    if (activeTab === "complaints") return 0;
    if (activeTab === "suggestions") return 1;
    return 2;
  };

  const getMessageSubject = () => {
    if (activeTab === "suggestions") return "Suggestion";
    if (activeTab === "complaints") return "Complaint";
    return "Rating";
  };

  const handleMailSubmit = async () => {
    if (!validateEmail(email)) {
      setEmailError(tx("invalid-email", "البريد الإلكتروني غير صحيح"));
      toast.error(tx("invalid-email", "البريد الإلكتروني غير صحيح"));
      return;
    }

    if (!description.trim()) {
      toast.error(tx("message-required", "من فضلك اكتب الرسالة"));
      return;
    }

    if (activeTab === "ratings" && !rate) {
      toast.error(tx("rating-required", "من فضلك اختر التقييم"));
      return;
    }

    const messageData = {
      email,
      subject: getMessageSubject(),
      body: description.trim(),
      ratingValue: activeTab === "ratings" ? rate : 0,
      type: getMessageType(),
    };

    const response = await api.post("/mail/send", messageData, {
      headers: {
        "Content-Type": "application/json",
        accept: "*/*",
      },
    });

    const responseData = response?.data;

    if (responseData?.statusCode === 0 || responseData?.success) {
      const successMsg =
        activeTab === "suggestions"
          ? tx("suggestions-done", "تم إرسال الاقتراح بنجاح")
          : tx("ratings-done", "تم إرسال التقييم بنجاح");

      setSubmitMessage(successMsg);
      setSubmitted(true);

      setEmail("");
      setDescription("");
      setRate(0);
      setEmailError("");

      toast.success(successMsg);
    } else {
      toast.error(
        responseData?.message ||
          tx("message-send-failed", "تعذر إرسال الرسالة"),
      );
    }
  };

  const handleComplaintSubmit = async () => {
    const fullName = complaintData.fullName.trim();
    const complaintEmail = complaintData.email.trim();
    const phone = complaintData.phone.trim();
    const categoryId = Number(complaintData.categoryId);
    const messageText = complaintData.messageText.trim();

    if (!categoryId) {
      toast.error(
        tx("complaint-category-required", "من فضلك اختر فئة الشكوى"),
      );
      return;
    }

    if (
      categoryId === COMPLAINT_CATEGORIES.FACULTIES &&
      !complaintData.facultyCode
    ) {
      toast.error(tx("faculty-required", "من فضلك اختر الكلية"));
      return;
    }

    if (!fullName) {
      toast.error(tx("name-required", "من فضلك اكتب الاسم"));
      return;
    }

    if (!validateEmail(complaintEmail)) {
      toast.error(tx("invalid-email", "البريد الإلكتروني غير صحيح"));
      return;
    }

    if (!phone) {
      toast.error(tx("phone-required", "من فضلك اكتب رقم الهاتف"));
      return;
    }

    if (!messageText) {
      toast.error(tx("message-required", "من فضلك اكتب نص الشكوى"));
      return;
    }

    const response = await newsService.submitComplain({
      fullName,
      email: complaintEmail,
      phone,
      categoryId,
      messageText,
      facultyCode:
        categoryId === COMPLAINT_CATEGORIES.FACULTIES
          ? complaintData.facultyCode
          : "",
      attachments: complaintData.attachments,
    });

    const complaintId =
      response?.complaintId || response?.result?.complaintId || "";

    const successMsg = complaintId
      ? tx(
          "complaint-submit-success-with-id",
          "تم إرسال الشكوى بنجاح. رقم الشكوى: {{complaintId}}",
          { complaintId },
        )
      : response?.message ||
        tx("complaint-submit-success", "تم إرسال الشكوى بنجاح");

    setSubmitMessage(successMsg);
    setSubmitted(true);

    setComplaintData({
      fullName: "",
      email: "",
      phone: "",
      categoryId: "",
      facultyCode: "",
      messageText: "",
      attachments: [],
    });

    setFacultySearch("");
    setIsFacultyDropdownOpen(false);
    setAttachmentInputKey((prev) => prev + 1);

    toast.success(successMsg);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setSubmitted(false);
    setSubmitMessage("");

    try {
      if (activeTab === "complaints") {
        await handleComplaintSubmit();
      } else {
        await handleMailSubmit();
      }
    } catch (error) {
      console.error("Submit error:", error);

      const errorMessage =
        error?.response?.data?.message ||
        tx("message-send-failed", "حدث خطأ أثناء الإرسال");

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFeedbackForm = () => {
    return (
      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label>
            {tx("email", "البريد الإلكتروني")}{" "}
            <span className="required">*</span>
          </label>

          <input
            type="email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            required
            placeholder={tx("email-placeholder", "اكتب بريدك الإلكتروني")}
          />

          {emailError && <p className="error-message">{emailError}</p>}
        </div>

        {activeTab === "ratings" && (
          <div className="form-group">
            <label>{tx("rating", "التقييم")}</label>

            <div className="rating-stars">
              {[5, 4, 3, 2, 1].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="star-button"
                >
                  <Star
                    fill={rate >= star ? "currentColor" : "none"}
                    className={rate >= star ? "star-filled" : "star-empty"}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>
            {tx("message", "الرسالة")} <span className="required">*</span>
          </label>

          <textarea
            name="message"
            value={description}
            onChange={handleMessageChange}
            required
            rows={5}
            placeholder={
              activeTab === "suggestions"
                ? tx(
                    "message-placeholder-suggestions",
                    "اكتب اقتراحك هنا...",
                  )
                : tx("message-placeholder-ratings", "اكتب تقييمك هنا...")
            }
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? (
            <div className="loading-wrapper">
              <div className="loading-spinner" />
              <span>{tx("sending", "جاري الإرسال...")}</span>
            </div>
          ) : (
            tx("submit", "إرسال")
          )}
        </button>
      </form>
    );
  };

  const renderComplaintForm = () => {
    const selectedFileNames = complaintData.attachments
      ?.map((file) => file.name)
      .join("، ");

    const selectedFaculty = colleges.find(
      (college) => String(college.fac) === String(complaintData.facultyCode),
    );

    const normalizedFacultySearch = facultySearch.trim().toLowerCase();

    const filteredColleges = normalizedFacultySearch
      ? colleges.filter((college) => {
          const title = String(college.title || "").toLowerCase();

          return title.includes(normalizedFacultySearch);
        })
      : colleges;

    return (
      <form
        onSubmit={handleSubmit}
        className="contact-form complaint-form modern-complaint-form"
      >
        <div className="form-group full-row">
          <label>
            {tx("complaint-category", "الفئة")}{" "}
            <span className="required">*</span>
          </label>

          <div className="complaint-category-buttons">
            <button
              type="button"
              className={`complaint-category-btn ${
                selectedCategoryId === COMPLAINT_CATEGORIES.SPECIAL_UNITS
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleCategoryChange(COMPLAINT_CATEGORIES.SPECIAL_UNITS)
              }
            >
              {tx("special-units", "وحدات ذات طابع خاص")}
            </button>

            <button
              type="button"
              className={`complaint-category-btn ${
                selectedCategoryId === COMPLAINT_CATEGORIES.DEPARTMENTS
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleCategoryChange(COMPLAINT_CATEGORIES.DEPARTMENTS)
              }
            >
              {tx("general-administration", "الإدارة العامة")}
            </button>

            <button
              type="button"
              className={`complaint-category-btn ${
                selectedCategoryId === COMPLAINT_CATEGORIES.FACULTIES
                  ? "active"
                  : ""
              }`}
              onClick={() =>
                handleCategoryChange(COMPLAINT_CATEGORIES.FACULTIES)
              }
            >
              {tx("faculties", "الكليات")}
            </button>
          </div>
        </div>

        {isFacultyComplaint && (
          <div className="form-group full-row">
            <label>
              {tx("faculty", "الكلية")} <span className="required">*</span>
            </label>

            <div className="faculty-dropdown">
              <button
                type="button"
                className={`faculty-dropdown-trigger ${
                  isFacultyDropdownOpen ? "open" : ""
                } ${selectedFaculty ? "has-value" : ""}`}
                onClick={() => {
                  if (!collegesLoading) {
                    setIsFacultyDropdownOpen((prev) => !prev);
                  }
                }}
                disabled={collegesLoading}
              >
                <span className="faculty-trigger-content">
                  <span className="faculty-trigger-title">
                    {collegesLoading
                      ? tx("loading-faculties", "جاري تحميل الكليات...")
                      : selectedFaculty
                        ? selectedFaculty.title
                        : tx("select-faculty", "اختر الكلية")}
                  </span>
                </span>

                <ChevronDown
                  size={20}
                  className={`faculty-chevron ${
                    isFacultyDropdownOpen ? "rotate" : ""
                  }`}
                />
              </button>

              {isFacultyDropdownOpen && (
                <div className="faculty-dropdown-panel">
                  <div className="faculty-search-box">
                    <Search size={18} />
                    <input
                      type="text"
                      value={facultySearch}
                      onChange={(e) => setFacultySearch(e.target.value)}
                      placeholder={tx(
                        "faculty-search-placeholder",
                        "ابحث باسم الكلية...",
                      )}
                      autoFocus
                    />
                  </div>

                  <div className="faculty-options-list">
                    {filteredColleges.length > 0 ? (
                      filteredColleges.map((college) => {
                        const isSelected =
                          String(college.fac) ===
                          String(complaintData.facultyCode);

                        return (
                          <button
                            key={`${college.fac}-${college.id}`}
                            type="button"
                            className={`faculty-option ${
                              isSelected ? "selected" : ""
                            }`}
                            onClick={() => handleFacultySelect(college.fac)}
                          >
                            <span className="faculty-option-text">
                              <span className="faculty-option-title">
                                {college.title}
                              </span>
                            </span>

                            {isSelected && <Check size={18} />}
                          </button>
                        );
                      })
                    ) : (
                      <div className="faculty-empty-state">
                        {tx("no-matching-results", "لا توجد نتائج مطابقة")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="form-group">
          <label>
            {tx("name", "الاسم")} <span className="required">*</span>
          </label>

          <input
            type="text"
            name="fullName"
            value={complaintData.fullName}
            onChange={handleComplaintChange}
            required
            placeholder={tx("name-placeholder", "أدخل اسمك")}
          />
        </div>

        <div className="form-group">
          <label>
            {tx("email", "البريد الإلكتروني")}{" "}
            <span className="required">*</span>
          </label>

          <input
            type="email"
            name="email"
            value={complaintData.email}
            onChange={handleComplaintChange}
            required
            placeholder={tx("email-placeholder", "أدخل بريدك الإلكتروني")}
          />
        </div>

        <div className="form-group full-row">
          <label>
            {tx("phone", "رقم الهاتف")} <span className="required">*</span>
          </label>

          <input
            type="tel"
            name="phone"
            value={complaintData.phone}
            onChange={handleComplaintChange}
            required
            placeholder={tx("phone-placeholder", "ادخل رقم الهاتف")}
          />
        </div>

        <div className="form-group full-row">
          <label>
            {tx("message-text", "نص الرسالة")}{" "}
            <span className="required">*</span>
          </label>

          <textarea
            name="messageText"
            value={complaintData.messageText}
            onChange={handleComplaintChange}
            required
            rows={5}
            placeholder={tx(
              "complaint-message-placeholder",
              "أدخل شكواك هنا...",
            )}
          />
        </div>

        <div className="form-group full-row">
          <div className="complaint-upload-box">
            <input
              key={attachmentInputKey}
              id="complaint-attachments"
              type="file"
              name="attachments"
              multiple
              onChange={handleAttachmentsChange}
            />

            <label
              htmlFor="complaint-attachments"
              className="upload-drop-label"
            >
              <span className="upload-icon">
                <UploadCloud size={34} strokeWidth={2.2} />
              </span>

              <strong>
                {tx(
                  "upload-drop-title",
                  "اسحب الملف هنا أو اضغط للاختيار",
                )}
              </strong>

              <span className="upload-actions">
                <span className="upload-secondary-btn">
                  {tx("upload-file", "رفع ملف")}
                </span>

                <span className="upload-primary-btn">
                  {tx("choose-file", "اختيار ملف")}
                </span>
              </span>

              {selectedFileNames && (
                <small className="selected-files">{selectedFileNames}</small>
              )}
            </label>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="submit-button">
          {isSubmitting ? (
            <div className="loading-wrapper">
              <div className="loading-spinner" />
              <span>{tx("sending", "جاري الإرسال...")}</span>
            </div>
          ) : (
            tx("submit", "إرسال")
          )}
        </button>
      </form>
    );
  };

  const renderForm = () => {
    if (submitted) {
      return <div className="success-message">{submitMessage}</div>;
    }

    if (activeTab === "complaints") {
      return renderComplaintForm();
    }

    return renderFeedbackForm();
  };

  return (
    <div>
      <div
        className="contact-page"
        style={isRTL ? pArStyle : pEnStyle}
dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="container">
          <div className="contact-wrapper">
            <div className="contact-info">
              <div className="info-header">
                <h2>{tx("contact-us", "تواصل معنا")}</h2>
                <p>{tx("contact-desc", "يسعدنا تواصلك معنا في أي وقت.")}</p>
              </div>

              <div className="info-items">
                <div className="info-item">
                  <div className="icon-wrapper">
                    <Phone size={20} className="contact-info-icon" />
                  </div>

                  <div className="info-content">
                    <p className="info-label">{tx("phone", "الهاتف")}</p>
                    <p className="info-value">0482222170</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="icon-wrapper">
                    <Mail size={20} className="contact-info-icon" />
                  </div>

                  <div className="info-content">
                    <p className="info-label">
                      {tx("email", "البريد الإلكتروني")}
                    </p>
                    <p className="info-value">info@menofia.edu.eg</p>
                  </div>
                </div>

                <div className="info-item">
                  <div className="icon-wrapper">
                    <MapPin size={20} className="contact-info-icon" />
                  </div>

                  <div className="info-content">
                    <p className="info-label">{tx("address", "العنوان")}</p>
                    <p className="info-value">
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href="https://maps.app.goo.gl/mQuJdCCYEvuoZkQDA"
                      >
                        {tx("address-value", "Menoufia Governorate, Egypt")}
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="main-content">
              <div className="tabs">
                <nav>
                  {tabs.map((tab) =>
                    tab.externalUrl ? (
                      <a
                        key={tab.id}
                        href={tab.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tab-button tab-link-button"
                      >
                        {tab.label}
                      </a>
                    ) : (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handleTabChange(tab.id)}
                        className={`tab-button ${
                          activeTab === tab.id ? "active" : ""
                        }`}
                      >
                        {tab.label}
                      </button>
                    ),
                  )}
                </nav>
              </div>

              <div className="form-container">
                <div className="form-header">
                  <h3>
                    {activeTab === "suggestions" &&
                      tx("suggestions", "الاقتراحات")}
                    {activeTab === "complaints" &&
                      tx("complaints", "الشكاوى")}
                    {activeTab === "ratings" && tx("ratings", "التقييمات")}
                  </h3>

                  <p>
                    {activeTab === "suggestions" &&
                      tx("suggestions-desc", "شاركنا اقتراحك لتحسين الخدمة.")}
                    {activeTab === "complaints" &&
                      tx("complaints-desc", "اكتب شكواك وسيتم التعامل معها.")}
                    {activeTab === "ratings" &&
                      tx("ratings-desc", "قيّم تجربتك معنا.")}
                  </p>
                </div>

                {renderForm()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactUs;