دلوقتي انا شغال علي مشروع تخرج الكليه ( تطوير لمنصه الوافدين جامعه المنوفيه ) 

انا خلصت التعديلات بتاعه ال endpoints الجديده وتقريبا تعديلات الفنكشنليتي خلصت

عايز بقا نتراجع الكود معايا وتشوفه ناقصه حاجه او لا ونحسن الدنيا يعني انا شايف فيه لودنج غريب 

ونشوف فيه حاجه ناقصه ولا لا

والمهم بقا كمان نظبط ال ui من نحيت ال layout والريسبونسف عايز الموقع يبقي لايوات احترافيه وريسبونسف قوي بحيث لو شغلت الموقع علي اي جهاز الشكل يبقي بروفيشنال 

ونهتم بالموبايل اوي

هبعتلك الستراكشر بتاع المشروع عشان تفهمه 

بعدين هبعتلك كل كومبوننت بال css بتاعه نعمل اللي اتفقنا عليه وتديني الكومبوننت متعدل

هنبدأ بال header ونمشي ال layer طبقه واحده



مش عايز نخرج عن النص 


```
src
├─ App.css
├─ App.jsx
├─ assets
│  ├─ 01.jpg
│  ├─ AboutUniversity.jpg
│  ├─ CurveLine.svg
│  ├─ flags
│  │  ├─ eg.webp
│  │  ├─ es.webp
│  │  ├─ fr.webp
│  │  ├─ gb.webp
│  │  └─ us.webp
│  ├─ home_image.jpg
│  ├─ image-1-1.htm
│  ├─ image-940x580 (2).jpg
│  ├─ image-940x580 (3).jpg
│  ├─ image-940x580 (4).jpg
│  ├─ image.png
│  ├─ image2.png
│  ├─ logo.jpg
│  ├─ MNF_logo.png
│  ├─ Polygon 2.svg
│  ├─ raes.jpg
│  ├─ University(1).jpg
│  ├─ University.jpg
│  └─ University2.jpg
├─ Collages
│  ├─ Collages.css
│  └─ Collages.tsx
├─ CollegeAndProgramsPage
│  ├─ CollegeAndProgramsPage.css
│  └─ CollegeAndProgramsPage.jsx
├─ components
│  ├─ DeleteConfirmModal.css
│  └─ DeleteConfirmModal.jsx
├─ ContactUsPage
│  ├─ ContactUs.css
│  └─ ContactUs.tsx
├─ custom.d.ts
├─ HomePage
│  ├─ About
│  │  ├─ About.css
│  │  └─ About.tsx
│  ├─ Carousel
│  │  ├─ Carousel.css
│  │  └─ Carousel.tsx
│  ├─ CollegesPrograms
│  │  ├─ CollegesPrograms.css
│  │  └─ CollegesPrograms.tsx
│  ├─ Footer
│  │  ├─ Footer.css
│  │  └─ Footer.tsx
│  ├─ Header
│  │  ├─ Header.css
│  │  └─ Header.tsx
│  ├─ Hero
│  │  ├─ Hero.css
│  │  └─ Hero.tsx
│  └─ Home.tsx
├─ hooks
│  └─ useAuth.js
├─ i18n.ts
├─ index.css
├─ Local
│  ├─ AR
│  │  ├─ College.json
│  │  ├─ Contact.json
│  │  ├─ Home.json
│  │  ├─ Login.json
│  │  ├─ News.json
│  │  ├─ NewsDetails.json
│  │  └─ Programs.json
│  ├─ DE
│  │  ├─ College.json
│  │  ├─ Contact.json
│  │  ├─ Home.json
│  │  ├─ Login.json
│  │  ├─ News.json
│  │  ├─ NewsDetails.json
│  │  └─ Programs.json
│  ├─ EN
│  │  ├─ College.json
│  │  ├─ Contact.json
│  │  ├─ Home.json
│  │  ├─ Login.json
│  │  ├─ News.json
│  │  ├─ NewsDetails.json
│  │  └─ Programs.json
│  └─ FR
│     ├─ College.json
│     ├─ Contact.json
│     ├─ Home.json
│     ├─ Login.json
│     ├─ News.json
│     ├─ NewsDetails.json
│     └─ Programs.json
├─ LoginPage
│  ├─ Login.css
│  └─ Login.tsx
├─ main.jsx
├─ NewsDetails
│  ├─ Details.css
│  └─ Details.tsx
├─ NewsPage
│  ├─ AddNews.css
│  ├─ AddNews.tsx
│  ├─ EditNews.tsx
│  ├─ News.css
│  ├─ News.tsx
│  ├─ SectionOne
│  │  ├─ SectionOne.css
│  │  └─ SectionOne.tsx
│  └─ SectionTow
│     ├─ SectionTow.css
│     └─ SectionTow.tsx
├─ ProgramsPage
│  ├─ Programs.css
│  └─ Programs.tsx
├─ README.md
├─ SectorsNewsPage
│  ├─ SectorsNews.css
│  └─ SectorsNews.jsx
└─ Services
   ├─ api.js
   └─ newsService.js

```