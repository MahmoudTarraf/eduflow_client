import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Navigation
      home: 'Home',
      courses: 'Courses',
      about: 'About',
      contact: 'Contact',
      login: 'Login',
      register: 'Register',
      logout: 'Logout',
      profile: 'Profile',
      messages: 'Messages',
      settings: 'Settings',
      certificates: 'Certificates',
      wishlist: 'Wishlist',
      myWishlist: 'My Wishlist',
      emptyWishlist: 'Your wishlist is empty',
      saveCoursesForLater: 'Start adding courses you\'re interested in!',
      browseCourses: 'Browse Courses',
      addToWishlist: 'Add to Wishlist',
      removeFromWishlist: 'Remove from Wishlist',
      savedForLater: 'courses saved for later',
      myStats: 'My Stats',
      myAchievements: 'My Achievements',
      totalPoints: 'Total Points',
      currentStreak: 'Current Streak',
      badgesEarned: 'Badges Earned',
      activityOverview: 'Activity Overview',
      lessonsCompleted: 'Lessons Completed',
      quizzesCompleted: 'Quizzes Completed',
      coursesCompleted: 'Courses Completed',
      yourBadges: 'Your Badges',
      noBadgesYet: 'No badges earned yet',
      earnBadgesByCompleting: 'Complete lessons, quizzes, and courses to earn badges!',
      recentActivities: 'Recent Activities',
      noRecentActivities: 'No recent activities yet',
      trackYourProgress: 'Track your learning progress and achievements',
      pointsEarned: 'points earned',
      badgeUnlocked: 'badge unlocked',
      titleEarned: 'title earned',
      futureRewardsAwait: 'Future Rewards Await!',
      keepEarningPoints: 'Keep earning points to unlock exclusive discounts on future courses and premium features. Your dedication will be rewarded!',
      keepUpGreatWork: 'Keep Up the Great Work!',
      amazingStreak: 'Amazing streak! You\'re on fire 🔥',
      excellentProgress: 'You\'re making excellent progress! 💪',
      everyStepCounts: 'Every step counts. Keep learning! 📚',
      refresh: 'Refresh',
      dashboard: 'Dashboard',
      leaderboard: 'Leaderboard',
      searchStudents: 'Search students by name or email',
      noStudentsFound: 'No students found',
      searchLabel: 'Search',
      
      // Auth
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      name: 'Name',
      phone: 'Phone',
      role: 'Role',
      countryLabel: 'Country',
      cityLabel: 'City',
      schoolLabel: 'School/University (Highest Education)',
      student: 'Student',
      instructor: 'Instructor',
      admin: 'Admin',
      forgotPassword: 'Forgot Password?',
      rememberMe: 'Remember Me',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      back: 'Back',
      iAgreeTo: 'I agree to the',
      andLabel: 'and',
      wantToTeach: 'Want to teach on EduFlow?',
      becomeInstructor: 'Become an Instructor',
      instructorAgreementCheckbox: 'I have read and agree to the terms and conditions of the Instructor Agreement',
      mustAgreeTerms: 'You must agree to the Terms of Service and Privacy Policy to continue',
      // Form Placeholders
      enterYourEmail: 'Enter your email',
      enterYourPassword: 'Enter your password',
      enterYourFullName: 'Enter your full name',
      enterYourCountry: 'Enter your country',
      enterYourCity: 'Enter your city',
      enterYourSchoolUniversity: 'Enter your school or university',
      
      // Instructor Registration (multi-step)
      instructorRegToastFillRequired: 'Please fill in all required fields',
      instructorRegToastPasswordsMismatch: 'Passwords do not match',
      instructorRegToastPasswordMinLength: 'Password must be at least 12 characters and include uppercase, lowercase, number, and symbol',
      instructorRegToastPasswordRequireLower: 'Password must include at least one lowercase letter',
      instructorRegToastPasswordRequireUpper: 'Password must include at least one uppercase letter',
      instructorRegToastPasswordRequireNumber: 'Password must include at least one number',
      instructorRegToastPasswordRequireSymbol: 'Password must include at least one symbol',
      instructorRegToastPhoneInvalid: 'Phone must start with 09 and be exactly 10 digits',
      instructorRegToastExpertiseRequired: 'Please select at least one area of expertise',
      instructorRegToastCustomExpertiseRequired: 'Please specify your custom expertise',
      instructorRegToastNameLettersOnly: 'Full name can only contain letters and spaces (no numbers or special characters)',
      instructorRegToastEnterEmailFirst: 'Please enter your email first',
      instructorRegConfirmRestartTitle: 'Are you sure you want to restart your registration? This will delete your current application progress.',
      instructorRegToastRestarted: 'Registration reset. You can start fresh now.',
      instructorRegToastPendingReview: 'Your application is currently under review. Please wait for admin approval.',
      instructorRegToastApproved: 'Your application has been approved! Please login.',
      instructorRegToastResumeExisting: 'Found existing application. Resuming registration...',
      instructorRegToastVerificationSent: 'Verification email sent! Check your inbox.',
      instructorRegToastRegistrationFailed: 'Registration failed. Please try again.',
      instructorRegConfirmResumeExisting: 'You have an incomplete registration. Would you like to restart from the beginning?',
      instructorRegToastEnterOTP: 'Please enter the verification code',
      instructorRegToastEmailVerified: 'Email verified successfully!',
      instructorRegToastVerificationFailed: 'Verification failed. Please try again.',
      instructorRegToastAgreeTerms: 'Please agree to the terms to continue',
      instructorRegToastSignatureRequired: 'Please provide your signature',
      instructorRegToastSignatureLettersOnly: 'Signature can only contain letters and spaces (no numbers or special characters)',
      instructorRegToastSignatureMustMatchName: 'Signature must exactly match your full name as entered above',
      instructorRegToastAgreementSigned: 'Agreement signed successfully!',
      instructorRegToastAgreementFailed: 'Failed to generate agreement. Please try again.',
      instructorRegToastVideoRequired: 'Please upload your introduction video',
      instructorRegToastVideoSaved: 'Video saved successfully!',
      instructorRegToastVideoSaveFailed: 'Failed to save video. Please try again.',
      instructorRegToastAgreementLoadFailed: 'Failed to load agreement text',
      instructorRegToastRestartFailed: 'Failed to restart registration. Please try again.',
      instructorRegStepLabel: 'Step {{current}} of {{total}}',
      instructorRegProgressPercent: '{{percent}}% Complete',
      instructorRegStep1Title: 'Personal Information',
      instructorRegStep1Subtitle: 'Tell us about yourself',
      instructorRegFullNameLabel: 'Full Name *',
      instructorRegFullNamePlaceholder: 'Enter your full name',
      instructorRegEmailLabel: 'Email *',
      instructorRegEmailPlaceholder: 'john@example.com',
      instructorRegPasswordLabel: 'Password *',
      instructorRegPasswordPlaceholder: '••••••••',
      instructorRegConfirmPasswordLabel: 'Confirm Password *',
      instructorRegConfirmPasswordPlaceholder: '••••••••',
      instructorRegPhoneLabel: 'Phone Number * (09XXXXXXXX)',
      instructorRegPhonePlaceholder: '0912345678',
      instructorRegExpertiseLabel: 'Areas of Expertise * (Select at least one)',
      instructorRegCustomExpertiseLabel: 'Please specify your expertise',
      instructorRegCustomExpertisePlaceholder: 'Enter your area of expertise',
      instructorRegStep2Title: 'Verify Your Email',
      instructorRegStep2Subtitle: 'We sent a verification code to {{email}}',
      instructorRegVerificationCodeLabel: 'Verification Code',
      instructorRegVerificationCodePlaceholder: '000000',
      instructorRegResendCode: 'Resend verification code',
      instructorRegStep3Title: 'Instructor Agreement',
      instructorRegStep3Subtitle: 'Review and sign the agreement',
      instructorRegRevenueSharingTitle: 'Revenue Sharing',
      instructorRegYourShareLabel: 'Your Share',
      instructorRegPlatformShareLabel: 'Platform Share',
      instructorRegAgreementHeading: 'Instructor Agreement',
      instructorRegSignatureLabel: 'Signature (Type your full name)',
      instructorRegSignaturePlaceholder: 'Your full name',
      instructorRegStep4Title: 'Introduction Video',
      instructorRegStep4Subtitle: 'Upload a short video introducing yourself',
      instructorRegVideoInstructions: 'Upload your introduction video (Max size {{maxSize}}MB)',
      instructorRegVideoSizeTooLarge: 'Video size must be less than {{maxSize}}MB',
      instructorRegUploadingVideo: 'Uploading video...',
      instructorRegUploadingVideoPercent: 'Uploading... {{percent}}%',
      instructorRegChooseVideoLabel: 'Choose Video',
      instructorRegVideoUploadedLabel: 'Video uploaded successfully!',
      instructorRegStep5Title: 'Application Submitted!',
      instructorRegStep5Subtitle: 'Thank you for applying to become an instructor on EduFlow! Our team will review your profile, agreement, and video shortly. You will receive an email once your application is approved.',
      instructorRegGoToLogin: 'Go to Login',
      instructorRegExpertiseProgramming: 'Programming',
      instructorRegExpertiseWebDevelopment: 'Web Development',
      instructorRegExpertiseMobileDevelopment: 'Mobile Development',
      instructorRegExpertiseDataScience: 'Data Science',
      instructorRegExpertiseMachineLearning: 'Machine Learning',
      instructorRegExpertiseCybersecurity: 'Cybersecurity',
      instructorRegExpertiseCloudComputing: 'Cloud Computing',
      instructorRegExpertiseDevOps: 'DevOps',
      instructorRegExpertiseUIUX: 'UI/UX Design',
      instructorRegExpertiseDigitalMarketing: 'Digital Marketing',
      instructorRegExpertiseBusiness: 'Business',
      instructorRegExpertiseLanguages: 'Languages',
      instructorRegExpertiseOther: 'Other',
      
      // Homepage
      welcomeTitle: 'Welcome to EduFlow Academy',
      welcomeSubtitle: 'Master programming and languages with expert instructors',
      getStarted: 'Get Started',
      learnMore: 'Learn More',
      recentCourses: 'Recent Courses',
      allCourses: 'All Courses',
      searchCourses: 'Search Courses',
      filterBy: 'Filter By',
      category: 'Category',
      level: 'Level',
      programming: 'Programming',
      language: 'Language',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      
      // Course
      courseDetails: 'Course Details',
      enrollNow: 'Enroll Now',
      continueCourse: 'Continue Course',
      registerForCourse: 'Register for Course',
      courseName: 'Course Name',
      duration: 'Duration',
      cost: 'Cost',
      description: 'Description',
      whatYouWillLearn: 'What You Will Learn',
      requirements: 'Requirements',
      lectures: 'Lectures',
      assignments: 'Assignments',
      projects: 'Projects',
      certificate: 'Certificate',
      
      // Student Dashboard
      myCourses: 'My Courses',
      enrolledCourses: 'Enrolled Courses',
      pendingCourses: 'Pending Courses',
      completedCourses: 'Completed Courses',
      discoverNewCourses: 'Discover New Courses',
      noCoursesYet: 'No courses yet',
      startLearning: 'Start Learning',
      progress: 'Progress',
      viewCourse: 'View Course',
      
      // Instructor Dashboard
      myTeaching: 'My Teaching',
      createCourse: 'Create Course',
      manageStudents: 'Manage Students',
      gradeAssignments: 'Grade Assignments',
      uploadContent: 'Upload Content',
      
      // Admin Dashboard
      manageUsers: 'Manage Users',
      manageCourses: 'Manage Courses',
      manageGroups: 'Manage Groups',
      approveEnrollments: 'Approve Enrollments',
      systemSettings: 'System Settings',
      
      // Common
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      submit: 'Submit',
      upload: 'Upload',
      download: 'Download',
      view: 'View',
      watch: 'Watch',
      read: 'Read',
      completed: 'Completed',
      pending: 'Pending',
      submitted: 'Submitted',
      graded: 'Graded',
      notSubmitted: 'Not Submitted',
      notCompleted: 'Not Completed',
      
      // Messages
      sendMessage: 'Send Message',
      newMessage: 'New Message',
      inbox: 'Inbox',
      sent: 'Sent',
      notifications: 'Notifications',
      
      // Settings
      accountSettings: 'Account Settings',
      preferences: 'Preferences',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmNewPassword: 'Confirm New Password',

      // Profile email/phone change & username rules
      changeEmail: 'Change Email',
      changePhoneNumber: 'Change Phone Number',
      verifyEmail: 'Verify Email',
      enterVerificationCode: 'Enter Verification Code',
      verificationCode: 'Verification Code',
      sendVerificationCode: 'Send Verification Code',
      verificationCodeSent: 'Verification code sent to your new email',
      verificationCodeSentHint: 'A verification code was sent to your new email and is valid for 10 minutes.',
      sendingCode: 'Sending code...',
      verifying: 'Verifying...',
      emailChangedSuccessfully: 'Email changed successfully',
      youHaveAlreadyChangedEmailOnce: 'You have already changed your email once',
      phoneChangedSuccessfully: 'Phone number updated successfully',
      youHaveAlreadyChangedPhoneNumber: 'You have already changed your phone number',
      phoneNumberAlreadyExists: 'Phone number already exists',
      phoneMustStartWith09: 'Phone number must be 10 digits starting with 09',
      failedToSendVerificationCode: 'Failed to send verification code',
      failedToVerifyEmail: 'Failed to verify email change',
      verificationCodeExpired: 'Verification code has expired. Please request a new code.',
      invalidVerificationCode: 'Invalid verification code',
      failedToChangePhone: 'Failed to change phone number',
      newEmail: 'New Email',
      enterNewEmail: 'Enter your new email',
      enterNewPhone: 'Enter your new phone number (09xxxxxxxx)',
      confirmPhoneChange: 'Confirm Phone Change',
      updating: 'Updating...',
      youCanRequestNewCodeIn: 'You can request a new code in {{seconds}} seconds.',
      invalidEmailFormat: 'Please enter a valid email address.',
      emailChangeableOnce: 'Email (changeable once)',
      phoneChangeableOnce: 'Phone number (changeable once)',
      emailChangesRemaining: 'Email changes remaining',
      phoneChangesRemaining: 'Phone changes remaining',
      studentEmailUsernameWarning: 'Note: You can change your email one time only. Your username appears on your certificates, so make sure it is correct before requesting changes.',
      instructorPublicInfoWarning: 'Warning: Your email, username, and intro video are publicly visible to students. Please make sure the information you enter is accurate and appropriate.',
      adminOnlyCanChangeUsername: 'Admin only can change username',
      resetChangeLimitsConfirm: 'Reset email/phone change limits for {{name}}? This will allow the user to change email and phone one more time.',
      resetChangeLimitsSuccess: 'Email/phone change limits have been reset.',
      resetChangeLimitsFailed: 'Failed to reset email/phone change limits',
      resetChangeLimitsTooltip: 'Reset email/phone change limits',
      emailChangeLimitReached: 'You have reached the email change limit.',
      phoneChangeLimitReached: 'You have reached the phone number change limit.',
      emailChangeLimitReachedDescription: 'You can only change your email once. If you need to change it again, please contact the admin.',
      phoneChangeLimitReachedDescription: 'You can only change your phone number once. If you need to change it again, please contact the admin.',
      emailChangeLimitReset: 'Email change limit reset successfully.',
      phoneChangeLimitReset: 'Phone number change limit reset successfully.',
      emailChangeLimitResetFailed: 'Failed to reset email change limit.',
      phoneChangeLimitResetFailed: 'Failed to reset phone number change limit.',

      // Errors
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Info',
      somethingWentWrong: 'Something went wrong',
      tryAgain: 'Try Again',
      retry: 'Retry',
      videoNetworkError: 'Network error, please try again.',
      videoApiLoadTimeout: 'Connection timed out, please try again.',
      videoApiLoadFailed: 'Failed to load video player, please try again.',
      loading: 'Loading...',
      processing: 'Processing...',
      completeLabel: 'Complete',
      continueLabel: 'Continue',
      
      // Time
      weeks: 'weeks',
      days: 'days',
      hours: 'hours',
      minutes: 'minutes',
      
      // Currency
      currency: '$',
      
      // Footer
      footerTagline: 'Empowering learners worldwide',
      quickLinks: 'Quick Links',
      support: 'Support',
      legal: 'Legal',
      helpCenter: 'Help Center',
      faq: 'FAQ',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      allRightsReserved: 'All rights reserved',
      followUs: 'Follow Us',
      categories: 'Categories',
      levels: 'Levels',
      contactInfo: 'Contact Info',
      
      // Homepage Sections
      whyChooseUs: 'Why Choose EduFlow Academy?',
      discoverBenefits: 'Discover the benefits of learning with our platform',
      expertInstructors: 'Expert Instructors',
      expertInstructorsDesc: 'Learn from industry professionals with years of experience',
      learnFromIndustryExperts: 'Learn from industry professionals with years of experience',
      certificatesAwarded: 'Certificates Awarded',
      earnRecognizedCertificates: 'Earn recognized certificates upon course completion',
      interactiveLearning: 'Interactive Learning',
      engageWithPeers: 'Engage with peers and instructors in real-time',
      careerGrowth: 'Career Growth',
      advanceYourCareerPath: 'Advance your career with in-demand skills',
      flexibleSchedule: 'Flexible Schedule',
      learnAtYourOwnPace: 'Learn at your own pace, anytime, anywhere',
      globalCommunity: 'Global Community',
      joinLearnersWorldwide: 'Join thousands of learners worldwide',
      richContent: 'Rich Content',
      accessComprehensiveMaterials: 'Access comprehensive learning materials',
      goalOriented: 'Goal-Oriented',
      achieveYourLearningGoals: 'Structured paths to achieve your goals',
      joinThousandsOfLearners: 'Join thousands of learners transforming their careers',
      flexibleLearning: 'Flexible Learning',
      flexibleLearningDesc: 'Study at your own pace, anytime, anywhere',
      certifiedCourses: 'Certified Courses',
      certifiedCoursesDesc: 'Earn recognized certificates upon course completion',
      affordablePricing: 'Affordable Pricing',
      affordablePricingDesc: 'Quality education at competitive prices',
      readyToStart: 'Ready to start your learning journey?',
      readyToStartDesc: 'Join thousands of students already learning with us',
      whatStudentsSay: 'What Our Students Say',
      paymentMethods: 'Payment Methods',
      weAccept: 'We Accept',
      securePayment: 'Secure Payment Processing',
      
      // About Page
      aboutUsTitle: 'About Us',
      ourMission: 'Our Mission',
      ourMissionDesc: 'To provide accessible quality education to everyone, everywhere, empowering learners to achieve their goals.',
      ourVision: 'Our Vision',
      ourVisionDesc: 'To be the world\'s leading online education platform, transforming lives through learning.',
      ourValues: 'Our Values',
      ourTeam: 'Our Team',
      aboutEduFlow: 'About EduFlow',
      aboutDescription: 'EduFlow Academy is a leading online learning platform dedicated to providing quality education to students worldwide.',
      meetOurTeam: 'Meet Our Team',
      quality: 'Quality',
      qualityDesc: 'We maintain the highest standards in education',
      innovation: 'Innovation',
      innovationDesc: 'We continuously improve our platform and learning experience',
      accessibility: 'Accessibility',
      accessibilityDesc: 'Education for everyone, everywhere, at any time',
      community: 'Community',
      communityDesc: 'Building a supportive learning community',
      
      // Help Center
      helpCenterTitle: 'Help Center',
      howCanWeHelpYou: 'How can we help you?',
      searchForAnswers: 'Search for answers or browse articles by category',
      searchHelp: 'Search help articles...',
      browseCategories: 'Browse Categories',
      popularArticles: 'Popular Articles',
      gettingStarted: 'Getting Started',
      coursesAndLearning: 'Courses & Learning',
      instructors: 'Instructors',
      paymentsAndBilling: 'Payments & Billing',
      accountManagement: 'Account Management',
      troubleshooting: 'Troubleshooting',
      allCategories: 'All Categories',
      
      // Help Articles - Getting Started
      helpQ1: 'How to create an account',
      helpA1: `Creating an account on EduFlow is simple:
    
1. Click the "Register" button in the top navigation bar
2. Choose your role: Student or Instructor
3. Fill in your details (name, email, password)
4. Verify your email address by clicking the link sent to your inbox
5. Complete your profile with additional information

Students can start enrolling in courses immediately after registration. Instructors need to wait for admin approval before creating courses.`,
      
      helpQ2: 'Enrolling in courses',
      helpA2: `To enroll in a course:

1. Browse available courses from the homepage or Courses page
2. Click on a course to view its details
3. Check the course sections - some may be free, others paid
4. Click "Enroll" on free sections or "Pay & Enroll" on paid sections
5. For paid sections, upload your payment receipt (bank transfer proof)
6. Wait for instructor approval of your payment
7. Once approved, access all course content

You can enroll in multiple courses and track your progress from your dashboard.`,
      
      helpQ3: 'Navigating the platform',
      helpA3: `Platform Navigation Guide:

**Main Navigation Bar:**
- Home: Return to homepage
- Courses: Browse all available courses
- Instructors: View all instructors
- About: Learn about EduFlow
- Contact: Get in touch with admin

**User Dashboard (after login):**
- Students: View enrolled courses, track progress, submit assignments
- Instructors: Manage courses, sections, content, grade assignments
- Admin: Manage users, verify payments, oversee platform

**Profile Menu (top-right):**
- Dashboard: Go to your main dashboard
- Profile: View public profile
- Settings: Update profile info and avatar
- Logout: Sign out of your account`,
      
      helpQ4: 'Managing your profile',
      helpA4: `Profile Management:

1. Click your avatar/name in the top-right corner
2. Select "Settings" from dropdown menu
3. Update your information:
   - Profile Picture: Upload image (max 5MB)
   - Name and Email
   - Phone number
   - Short Bio (500 chars)
   - Detailed About Me (with rich text formatting)
   - Job Role (for students)
   - Expertise and Social Links (for instructors)
4. Click "Save Settings"

Your avatar will appear throughout the platform. Make sure to use a clear, professional photo!`,
      
      // Help Articles - Courses & Learning (5-8)
      helpQ5: 'Accessing course content',
      helpA5: `Access Course Content:

1. Go to your Student Dashboard
2. Click on any enrolled course
3. View course structure: Groups → Sections → Content
4. Click on a section to view its content
5. Content types include:
   - Video Lectures: Watch and track progress
   - Assignments: Download, complete, and submit
   - Projects: Starter files and submission

**Access Requirements:**
- Free sections: Available immediately after enrollment
- Paid sections: Available after payment verification
- Prerequisites: Complete previous sections first (if required)`,
      
      helpQ6: 'Tracking your progress',
      helpA6: `Progress Tracking:

Your progress is automatically tracked:

**Videos:**
- Progress updates as you watch
- Marked as "Watched" (100%) when complete
- Can review anytime

**Assignments/Projects:**
- Shows "Pending Upload" before submission
- Shows "Pending Review (50%)" after submission
- Shows final grade (0-100%) after instructor grading

**Overall Progress:**
- View section completion percentage
- Track course-wide progress
- See grades for all assessments

Progress is saved in real-time and syncs across devices.`,
      
      helpQ7: 'Submitting assignments',
      helpA7: `Assignment Submission Process:

1. Watch all lecture videos in the section
2. Download the assignment file (usually .rar format)
3. Complete the assignment according to instructions
4. Compress your work into a .rar file
5. Click "Choose File" and select your .rar file
6. Submit the assignment
7. Receive initial 50% grade (pending review)
8. Wait for instructor grading
9. View final grade and feedback

**Important:**
- Only .rar files are accepted
- File size limit: 500MB
- Submit before deadline to avoid penalties
- You can resubmit if instructor allows`,
      
      helpQ8: 'Downloading materials',
      helpA8: `Download Course Materials:

**To download materials:**
1. Navigate to the section content
2. Look for the "Download" button next to assignments/projects
3. Click to download starter files, resources, or templates
4. Materials are typically in .rar or .zip format

**Available Downloads:**
- Assignment templates and instructions
- Project starter code
- Supplementary resources
- Reference materials

**Troubleshooting:**
- If download fails, refresh and try again
- Ensure stable internet connection
- Contact instructor if file is unavailable`,
      
      // Help Articles - Instructors (9-12)
      helpQ9: 'Becoming an instructor',
      helpA9: `Become an EduFlow Instructor:

**Application Process:**
1. Register with "Instructor" role
2. Complete your profile with:
   - Professional photo
   - Detailed bio and expertise
   - Social links (LinkedIn, GitHub, etc.)
3. Wait for admin approval (usually 24-48 hours)
4. Receive email notification upon approval

**Requirements:**
- Expertise in your teaching domain
- Professional profile
- Commitment to quality education
- Responsive to student queries

**After Approval:**
- Create unlimited courses
- Set your own pricing
- Manage students and content
- Earn from paid sections`,
      
      helpQ10: 'Creating courses',
      helpA10: `Create a New Course:

1. Go to Instructor Dashboard
2. Click "Create New Course"
3. Fill in course details:
   - Name and description
   - Level (Beginner, Intermediate, Advanced)
   - Duration and category
   - Course thumbnail (optional)
4. Save the course
5. Create Groups (course batches)
6. Add Sections to groups
7. Upload content (videos, assignments, projects)
8. Set pricing for each section
9. Publish when ready

**Best Practices:**
- Clear course objectives
- Well-structured content
- Engaging video lectures
- Practical assignments
- Timely student support`,
      
      helpQ11: 'Managing students',
      helpA11: `Student Management:

**View Enrolled Students:**
1. Go to course details
2. View students per group
3. Track enrollment status

**Monitor Progress:**
- View student completion rates
- Check assignment submissions
- Track grades and performance

**Communication:**
- Message students directly
- Respond to queries
- Provide feedback on assignments

**Payment Verification:**
- Review payment receipts
- Approve or reject payments
- Students gain access after approval`,
      
      helpQ12: 'Grading assignments',
      helpA12: `Assignment Grading Process:

1. Go to "Assignment Grading" tab in dashboard
2. View pending submissions
3. Download student's .rar file
4. Review the work
5. Enter grade (0-100%)
6. Add feedback comments
7. Submit grade
8. Student receives notification

**Grading Guidelines:**
- Be fair and consistent
- Provide constructive feedback
- Grade within reasonable timeframe
- Consider effort and understanding
- Use rubrics for objectivity

**Initial 50% Grade:**
Students automatically receive 50% upon submission as "pending review" grade. Your final grade replaces this.`,
      
      // Help Articles - Payments & Billing (13-16)
      helpQ13: 'Payment methods',
      helpA13: `Payment Methods:

**Current Payment System:**
EduFlow uses bank transfer payment system:

1. View section price
2. Click "Pay & Enroll"
3. You'll see bank transfer details
4. Make payment to provided account
5. Take screenshot/photo of receipt
6. Upload receipt (JPG, PNG, or PDF - max 10MB)
7. Submit for verification
8. Wait for instructor approval
9. Access content once approved

**Supported Receipt Formats:**
- Image: JPG, JPEG, PNG
- Document: PDF

**Processing Time:**
Usually 24-48 hours for approval.`,
      
      helpQ14: 'Refund policy',
      helpA14: `Refund Policy:

**30-Day Money-Back Guarantee:**
- Request refund within 30 days of payment
- Applies to all paid sections
- No questions asked

**Refund Process:**
1. Contact instructor or admin
2. Provide payment receipt and reason
3. Refund processed within 5-7 business days
4. Money returned to original payment method

**Conditions:**
- Must request within 30 days
- Original receipt required
- Account may be suspended for abuse
- No refunds after completion

**Contact:** Send message via platform or email support.`,
      
      helpQ15: 'Receipt verification',
      helpA15: `Receipt Verification Process:

**For Students:**
1. Upload clear receipt after payment
2. Wait for instructor/admin review
3. Receive email notification of status
4. Access granted upon approval

**Verification Criteria:**
- Receipt shows correct amount
- Transaction date is recent
- Account details match
- Receipt is legible and authentic

**If Rejected:**
- Re-upload clearer receipt
- Contact instructor for clarification
- Check payment amount matches price

**Processing Time:**
- Weekdays: 24-48 hours
- Weekends: May take longer
- Urgent: Message instructor directly`,
      
      helpQ16: 'Payment issues',
      helpA16: `Common Payment Issues & Solutions:

**Receipt Upload Failed:**
- Check file size (max 10MB)
- Use supported format (JPG, PNG, PDF)
- Ensure stable internet connection

**Payment Not Approved:**
- Verify correct amount was paid
- Check receipt is clear and complete
- Contact instructor for clarification
- Re-upload if first attempt was unclear

**Wrong Amount Paid:**
- Contact instructor immediately
- Provide proof of payment
- Instructor can adjust or request difference

**Payment Stuck in Pending:**
- Wait 48 hours for review
- Message instructor if urgent
- Check notifications for updates

**Contact Support:**
Use "Get In Touch" button in footer to message admin directly.`,
      
      // FAQ
      faqTitle: 'Frequently Asked Questions',
      frequentlyAskedQuestions: 'Frequently Asked Questions',
      findAnswersToCommonQuestions: 'Find quick answers to common questions about EduFlow Academy',
      searchQuestions: 'Search questions...',
      noQuestionsFound: 'No questions found matching your search.',
      didntFindLookingFor: "Didn't find what you're looking for?",
      contactSupportTeam: "Contact our support team and we'll be happy to help",
      general: 'General',
      coursesAndLearning: 'Courses & Learning',
      paymentsAndRefunds: 'Payments & Refunds',
      forInstructors: 'For Instructors',
      technicalSupport: 'Technical Support',
      contactSupport:'Contact Support',
      
      // FAQ Questions & Answers
      faqQ1: 'What is EduFlow Academy?',
      faqA1: 'EduFlow Academy is an online learning platform offering programming and language courses taught by industry experts. We provide comprehensive education to help you advance your career or learn new skills.',
      faqQ2: 'How do I create an account?',
      faqA2: 'Click on the "Sign Up" button in the top right corner, choose your role (Student or Instructor), fill in your details, and verify your email address. You can then start exploring courses immediately.',
      faqQ3: 'Is EduFlow Academy free?',
      faqA3: 'We offer both free and paid courses. Free courses provide basic content, while paid courses include premium features, certificates, and personalized support from instructors.',
      faqQ4: 'How do I enroll in a course?',
      faqA4: 'Browse our course catalog, click on a course that interests you, and click the "Enroll Now" button. For paid courses, complete the payment process. For free courses, you\'ll be enrolled immediately.',
      faqQ5: 'Can I access course content after completion?',
      faqA5: 'Yes! Once you enroll in a course, you have lifetime access to all course materials, including future updates and additional content added by the instructor.',
      faqQ6: 'How do I track my progress?',
      faqA6: 'Your progress is automatically tracked as you complete lessons, assignments, and projects. You can view your progress on your dashboard and within each course.',
      faqQ7: 'What if I fall behind in my course?',
      faqA7: 'All courses are self-paced, so you can learn at your own speed. There are no deadlines for most courses, allowing you to balance learning with your other commitments.',
      faqQ8: 'What payment methods do you accept?',
      faqA8: 'We accept multiple payment methods including Hawala transfers, Sham Cash, Western Union, and other local payment options. Select your preferred method during checkout.',
      faqQ9: 'How do I submit a payment receipt?',
      faqA9: 'After selecting your payment method, you\'ll be prompted to upload your payment receipt. You can drag and drop the file or click to browse. Accepted formats are JPG, PNG, and PDF.',
      faqQ10: 'What is your refund policy?',
      faqA10: 'We offer a 30-day money-back guarantee for all paid courses. If you\'re not satisfied with a course, contact our support team within 30 days of enrollment for a full refund.',
      faqQ11: 'How long does payment verification take?',
      faqA11: 'Payment verification typically takes 24-48 hours. You\'ll receive an email notification once your payment is verified and you can access the course content.',
      faqQ12: 'How do I become an instructor?',
      faqA12: 'Sign up for an instructor account, complete your profile with your expertise and experience, and submit an application. Our team will review your application and approve qualified instructors.',
      faqQ13: 'What do I need to create a course?',
      faqA13: 'You\'ll need course content (videos, assignments, projects), a course outline, and knowledge of your subject matter. We provide tools to upload videos, create assignments, and manage student enrollment.',
      faqQ14: 'How do I earn money as an instructor?',
      faqA14: 'Instructors earn revenue from course enrollments. You set your course prices, and we handle payment processing. Earnings are transferred to your account on a monthly basis.',
      faqQ15: 'Can I interact with my students?',
      faqA15: 'Absolutely! You can communicate with students through our messaging system, grade their assignments with feedback, and participate in course discussions.',
      faqQ16: 'What if videos won\'t play?',
      faqA16: 'Ensure you have a stable internet connection and use an updated browser (Chrome, Firefox, Safari, or Edge). Clear your browser cache and cookies if issues persist. Contact support if problems continue.',
      faqQ17: 'How do I download course materials?',
      faqA17: 'Navigate to the course content page and click the download icon next to any downloadable material (PDFs, code files, etc.). Files will be saved to your default downloads folder.',
      faqQ18: 'Can I access courses on mobile devices?',
      faqA18: 'Yes! Our platform is fully responsive and works on smartphones and tablets. Use any modern mobile browser to access your courses on the go.',
      faqQ19: 'What should I do if I encounter an error?',
      faqA19: 'Take a screenshot of the error message, note what you were doing when it occurred, and contact our support team via email or the help center with these details.',
      
      // Privacy Policy
      privacyPolicyTitle: 'Privacy Policy',
      lastUpdated: 'Last Updated',
      privacyIntro: 'Your privacy and data security are our top priorities',
      introduction: 'Introduction',
      privacyIntroText: 'At EduFlow Academy, we are committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we use it, and what rights you have in relation to it. By using our platform, you agree to the collection and use of information in accordance with this policy.',
      
      informationWeCollect: 'Information We Collect',
      infoCollect1: 'Personal information (name, email, phone number) provided during registration',
      infoCollect2: 'Payment information for course purchases',
      infoCollect3: 'Course progress and learning activity data',
      infoCollect4: 'Communication data through our messaging system',
      infoCollect5: 'Device information and usage data for platform improvement',
      
      howWeUseInfo: 'How We Use Your Information',
      useInfo1: 'To provide and maintain our educational services',
      useInfo2: 'To process payments and prevent fraud',
      useInfo3: 'To send course updates and important notifications',
      useInfo4: 'To improve our platform and user experience',
      useInfo5: 'To comply with legal obligations',
      
      dataSecurity: 'How We Protect Your Data',
      security1: 'Industry-standard encryption for data transmission',
      security2: 'Secure servers with regular security audits',
      security3: 'Limited access to personal data by authorized personnel only',
      security4: 'Regular backups to prevent data loss',
      security5: 'Compliance with international data protection regulations',
      
      yourRights: 'Your Rights',
      rights1: 'Access your personal data at any time',
      rights2: 'Request correction of inaccurate information',
      rights3: 'Request deletion of your account and data',
      rights4: 'Opt-out of marketing communications',
      rights5: 'Export your data in a portable format',
      
      dataSharing: 'Data Sharing',
      sharing1: 'We do not sell your personal information to third parties',
      sharing2: 'We may share data with payment processors for transactions',
      sharing3: 'Course completion data may be shared with instructors',
      sharing4: 'We may disclose information if required by law',
      sharing5: 'Anonymous analytics data may be used for research',
      
      cookiesAndTracking: 'Cookies and Tracking',
      cookies1: 'We use essential cookies for platform functionality',
      cookies2: 'Analytics cookies help us improve user experience',
      cookies3: 'You can disable cookies in your browser settings',
      cookies4: 'Some features may not work without cookies',
      cookies5: 'We do not use third-party advertising cookies',
      
      contactUsAboutPrivacy: 'Contact Us About Privacy',
      privacyContactText: 'If you have any questions or concerns about our Privacy Policy or how we handle your data, please don\'t hesitate to contact us:',
      email: 'Email',
      address: 'Address',
      changesToPolicy: 'Changes to This Policy',
      changesPolicyText: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy Policy periodically for any changes.',
      
      // Terms of Service
      termsOfServiceTitle: 'Terms of Service',
      effectiveDate: 'Effective Date',
      termsIntro: 'Please read these terms carefully before using EduFlow Academy',
      agreementToTerms: 'Agreement to Terms',
      agreementText: 'These Terms of Service govern your use of EduFlow Academy and constitute a legally binding agreement between you and EduFlow Academy. By accessing or using our platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use our services.',
      
      acceptanceOfTerms: 'Acceptance of Terms',
      acceptanceContent: 'By accessing and using EduFlow Academy, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. We reserve the right to modify these terms at any time, and your continued use constitutes acceptance of any changes.',
      
      userAccounts: 'User Accounts',
      userAccountsContent: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate and complete information during registration. You are responsible for all activities that occur under your account. Notify us immediately of any unauthorized use of your account.',
      
      courseAccess: 'Course Access and Content',
      courseAccessContent: 'Upon enrollment, you receive a non-exclusive, non-transferable license to access course content for personal use only. Course content is protected by copyright and cannot be redistributed, recorded, or shared without explicit permission. We reserve the right to modify or remove course content at any time.',
      
      paymentsAndRefunds: 'Payments and Refunds',
      paymentsContent: 'All course prices are listed in the specified currency. Payment must be made in full before accessing paid content. We offer a 30-day money-back guarantee for paid courses. Refunds are processed within 7-10 business days. Refund eligibility may be subject to review.',
      
      prohibitedActivities: 'Prohibited Conduct',
      prohibitedContent: 'You agree not to: share account credentials, redistribute course content, harass other users or instructors, use the platform for illegal activities, attempt to hack or compromise platform security, submit false or misleading information, or engage in any activity that interferes with platform operations.',
      
      intellectualProperty: 'Intellectual Property',
      intellectualPropertyContent: 'All content on EduFlow Academy, including courses, videos, text, graphics, logos, and software, is the property of EduFlow Academy or its content suppliers and is protected by copyright, trademark, and other intellectual property laws. Unauthorized use may result in legal action.',
      
      studentResponsibilities: 'Student Responsibilities',
      studentResp1: 'Complete courses at your own pace within access period',
      studentResp2: 'Submit original work for assignments and projects',
      studentResp3: 'Respect instructors and fellow students',
      studentResp4: 'Provide constructive feedback and ratings',
      studentResp5: 'Maintain academic integrity',
      
      instructorResponsibilities: 'Instructor Responsibilities',
      instructorResp1: 'Provide accurate course descriptions and prerequisites',
      instructorResp2: 'Deliver high-quality educational content',
      instructorResp3: 'Respond to student questions in a timely manner',
      instructorResp4: 'Grade assignments fairly and provide feedback',
      instructorResp5: 'Keep course content up-to-date',
      
      platformRights: 'Platform Rights',
      platformRight1: 'Modify or discontinue services at any time',
      platformRight2: 'Suspend or terminate accounts for violations',
      platformRight3: 'Monitor platform usage for quality and security',
      platformRight4: 'Update fees and pricing with notice',
      platformRight5: 'Collect and use data as per Privacy Policy',
      
      limitationOfLiability: 'Limitation of Liability',
      liabilityText1: 'EduFlow Academy is provided "as is" without warranties of any kind. We do not guarantee that the platform will be error-free or uninterrupted. To the fullest extent permitted by law, EduFlow Academy shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or other intangible losses.',
      liabilityText2: 'We are not responsible for the content provided by instructors or the outcomes of your learning experience. Course completion does not guarantee employment or any specific results.',
      
      disputeResolution: 'Dispute Resolution',
      disputeText: 'Any disputes arising from these Terms or your use of EduFlow Academy shall be resolved through binding arbitration in accordance with international arbitration rules. You agree to waive any right to a jury trial or to participate in a class action lawsuit.',
      
      questionsAboutTerms: 'Questions About Terms?',
      termsContactText: 'If you have any questions about these Terms of Service, please contact us:',
      disclaimers: 'Disclaimers',
      governingLaw: 'Governing Law',
      
      // Buttons & Actions
      browseAll: 'Browse All',
      seeMore: 'See More',
      seeLess: 'See Less',
      loadMore: 'Load More',
      showMore: 'Show More',
      showLess: 'Show Less',
      apply: 'Apply',
      reset: 'Reset',
      filter: 'Filter',
      sort: 'Sort',
      search: 'Search',
      clear: 'Clear',
      confirm: 'Confirm',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      previous: 'Previous',
      finish: 'Finish',
      
      // Tour Guide
      takeATour: 'Take a Tour',
      tourBack: 'Back',
      tourNext: 'Next',
      tourSkip: 'Skip Tour',
      tourFinish: 'Finish',
      tourClose: 'Close',
      tourStep: 'Step',
      tourOf: 'of',
      tourStepOf: 'من',
      
      // Home Tour Steps
      homeTourWelcomeTitle: 'Welcome to EduFlow! 🎓',
      homeTourWelcomeContent: 'Your journey to learning starts here. Browse featured courses and start learning today. Let\'s take a quick tour!',
      homeTourNavTitle: 'Navigation Bar 🧭',
      homeTourNavContent: 'Use the navigation bar to access Home, Courses, Instructors, About, and Contact pages.',
      homeTourCoursesTitle: 'Browse Courses 📚',
      homeTourCoursesContent: 'Click here to scroll to explore all available courses across different categories and levels.',
      homeTourInstructorsTitle: 'Meet Our Instructors 👨‍🏫',
      homeTourInstructorsContent: 'View all instructors and their expertise.',
      homeTourAboutTitle: 'About Us 📖',
      homeTourAboutContent: 'Learn more about EduFlow Academy and our mission to make education accessible to everyone.',
      homeTourContactTitle: 'Contact & Support 📞',
      homeTourContactContent: 'Need help? Contact us anytime for support and assistance.',
      homeTourUserActionsTitle: 'User Actions 🎯',
      homeTourUserActionsContent: 'Access theme settings, language options, messages, and your profile from here.',
      homeTourHeroTitle: 'Hero Section 🌟',
      homeTourHeroContent: 'This is our featured content showcasing what makes EduFlow special. Discover the best learning experience!',
      homeTourFeaturedTitle: 'Featured Courses 📚',
      homeTourFeaturedContent: 'Browse our collection of courses. Filter by category, level, or search for specific topics.',
      
      // Course Details Tour Steps
      courseDetailsTourWelcomeTitle: 'Course Details Page 📚',
      courseDetailsTourWelcomeContent: 'Learn everything about this course before enrolling. Let\'s explore what\'s available!',
      courseDetailsTourInfoTitle: 'Course Information ℹ️',
      courseDetailsTourInfoContent: 'View course title, description, level, category, and instructor details here.',
      courseDetailsTourSectionsTitle: 'Course Sections 📑',
      courseDetailsTourSectionsContent: 'Each course is organized into sections. Within each section, you will find: 📹 Lectures (videos to watch), 📝 Assignments (tasks to complete and submit), 🛠️ Projects (hands-on work to upload), and ✅ Active Tests (quizzes to solve). Expand any section to see its content!',
      courseDetailsTourCertificateTitle: 'Course Certificate 🎓',
      courseDetailsTourCertificateContent: 'When you complete all course requirements (lectures watched, assignments submitted, projects completed, and tests solved), you can request your course completion certificate from your dashboard or certificates tab!',
      
      // My Achievements (Stats) Tour Steps
      achievementsTourWelcomeTitle: 'Your Achievements & Rewards 🎉',
      achievementsTourWelcomeContent: 'This page shows how your learning activity turns into points, badges, titles, and wallet balance. Let\'s quickly explore how everything works.',
      achievementsTourHeaderTitle: 'Achievements Overview',
      achievementsTourHeaderContent: 'Here you can see your current title, total points, streak days, and a short summary of your progress on the platform.',
      achievementsTourPointsTitle: 'Points & Wallet Balance',
      achievementsTourPointsContent: 'Every time you complete lectures, assignments, projects, and tests, you earn points. Points can convert into wallet balance (in SYP) based on the current rate shown here, and you can later use that balance for discounts or rewards.',
      achievementsTourActivitiesTitle: 'Recent Gamification Activity',
      achievementsTourActivitiesContent: 'This timeline shows the latest points, badges, and titles you earned, with details about which course, lesson, or video they came from.',
      achievementsTourBadgesTitle: 'Badges & Progress',
      achievementsTourBadgesContent: 'Badges are visual rewards for your achievements. Each badge can also give bonus points. Keep completing content to unlock more badges and increase your total points.',
      achievementsTourMotivationTitle: 'Future Rewards & Motivation',
      achievementsTourMotivationContent: 'This area reminds you how close you are to future rewards. The more you learn, the more points, wallet balance, and recognition you gain on the platform.',
      
      // Student Dashboard Tour Steps
      studentDashboardTourWelcomeTitle: 'Welcome to Your Dashboard! 🎯',
      studentDashboardTourWelcomeContent: 'This is your learning hub. Let\'s explore what you can do here to maximize your learning!',
      studentDashboardTourCoursesTitle: 'My Enrolled Courses 📖',
      studentDashboardTourCoursesContent: 'View all courses you\'ve enrolled in. Click on any course to continue learning and track your progress.',
      studentDashboardTourCardsTitle: 'Course Cards 🎴',
      studentDashboardTourCardsContent: 'Each card shows your course details including progress, instructor, and level. Click to access course content.',
      studentDashboardTourPaymentTitle: 'Payment History 💳',
      studentDashboardTourPaymentContent: 'View all your course payments and receipts. Track your payment history and download invoices.',
      studentDashboardTourDiscoverTitle: 'Discover New Courses 🔍',
      studentDashboardTourDiscoverContent: 'Explore and enroll in new courses to expand your knowledge. Filter by category or level.',
      studentDashboardTourBrowseTitle: 'Browse All Courses 🌐',
      studentDashboardTourBrowseContent: 'Click here to see all available courses and find your next learning adventure!',
      studentDashboardTourMessagesTitle: 'Messages & Support 💬',
      studentDashboardTourMessagesContent: 'Communicate with instructors, get support, and receive important notifications about your courses.',
      
      // Dashboard Stats
      totalStudents: 'Total Students',
      totalCourses: 'Total Courses',
      totalInstructors: 'Total Instructors',
      activeEnrollments: 'Active Enrollments',
      courseProgress: 'Course Progress',
      overallGrade: 'Overall Grade',
      completionRate: 'Completion Rate',
      upcomingDeadlines: 'Upcoming Deadlines',
      recentActivity: 'Recent Activity',
      
      // Course Management
      addSection: 'Add Section',
      addContent: 'Add Content',
      editCourse: 'Edit Course',
      deleteCourse: 'Delete Course',
      publishCourse: 'Publish Course',
      unpublishCourse: 'Unpublish Course',
      courseStructure: 'Course Structure',
      sections: 'Sections',
      content: 'Content',
      students: 'Students',
      
      // User Management
      addUser: 'Add User',
      editUser: 'Edit User',
      deleteUser: 'Delete User',
      activateUser: 'Activate User',
      deactivateUser: 'Deactivate User',
      userDetails: 'User Details',
      userList: 'User List',
      
      // Contact
      contactUs: 'Contact Us',
      getInTouch: 'Get in Touch',
      sendUs: 'Send us a message',
      yourName: 'Your Name',
      yourEmail: 'Your Email',
      yourMessage: 'Your Message',
      
      // Footer specific
      company: 'Company',
      learning: 'Learning',
      eduflowAcademy: 'EduFlow Academy',
      eduflowTagline: 'Empowering learners worldwide with quality programming and language education.',
      joinThousands: 'Join thousands of students who have transformed their careers with our expert-led courses.',
      onlineLearningPlatform: 'Online Learning Platform',
      availableViaMessage: 'Available via message',
      enterSubject: 'Enter subject...',
      enterYourMessage: 'Enter your message...',
      sending: 'Sending...',
      
      // Instructors page
      meetOurInstructors: 'Meet Our Instructors',
      expertInstructorsTeam: 'Learn from industry-leading professionals',
      instructorsList: 'Instructors',
      rating: 'Rating',
      expertise: 'Expertise',
      
      // Profile & Settings
      myProfile: 'My Profile',
      editProfile: 'Edit Profile',
      personalInformation: 'Personal Information',
      fullName: 'Full Name',
      emailAddress: 'Email Address',
      phoneNumber: 'Phone Number',
      bio: 'Bio',
      updateProfile: 'Update Profile',
      profileUpdated: 'Profile updated successfully',
      
      // Settings
      generalSettings: 'General Settings',
      notificationSettings: 'Notification Settings',
      privacySettings: 'Privacy Settings',
      emailNotifications: 'Email Notifications',
      pushNotifications: 'Push Notifications',
      language: 'Language',
      theme: 'Theme',
      darkMode: 'Dark Mode',
      lightMode: 'Light Mode',
      
      // Homepage
      discoverBestCourses: 'Discover the Best Online Courses',
      transformCareer: 'Transform Your Career with Expert-Led Courses',
      exploreNow: 'Explore Now',
      viewDetails: 'View Details',
      enrolledStudents: 'Enrolled Students',
      weeks: 'weeks',
      viewAll: 'View All',
      seeAllCourses: 'See All Courses',
      recentCourses: 'Recent Courses',
      discoverMostPopularCourses: 'Discover our most popular courses',
      noCoursesFound: 'No courses found',
      tryDifferentFilters: 'Try adjusting your search or filters',
      noCoursesAvailable: 'No courses available yet',
      showMore: 'Show More',
      
      // Messages specific
      compose: 'Compose',
      reply: 'Reply',
      forward: 'Forward',
      markAsRead: 'Mark as Read',
      markAsUnread: 'Mark as Unread',
      deleteMessage: 'Delete Message',
      
      // Status
      active: 'Active',
      inactive: 'Inactive',
      published: 'Published',
      draft: 'Draft',
      approved: 'Approved',
      rejected: 'Rejected',
      
      // Time & Date
      today: 'Today',
      yesterday: 'Yesterday',
      lastWeek: 'Last Week',
      lastMonth: 'Last Month',
      thisYear: 'This Year',
      
      // Homepage Animations
      learnFromExperts: 'Learn from Experts',
      masterNewSkillsWithIndustryLeading: 'Master new skills with industry-leading instructors',
      advanceYourCareer: 'Advance Your Career',
      gainInDemandSkillsAndCertificates: 'Gain in-demand skills and earn recognized certificates',
      
      // Payment Methods
      paymentMethodsTitle: 'Payment Methods',
      choosePreferredPaymentMethod: 'Choose your preferred payment method and follow the instructions',
      fouad: 'Fouad',
      haram: 'Haram',
      shamCash: 'Sham Cash',
      westernUnion: 'Western Union',
      
      // Stats
      studentsCount: 'Students',
      coursesCount: 'Courses',
      instructorsCount: 'Instructors',
      successRate: 'Success Rate',
      
      // Search & Discovery
      searchCoursesPlaceholder: 'Search courses...',
      discoverMostPopularCourses: 'Discover our most popular courses',
      experienceBestOnlineEducation: 'Experience the best in online education',
      whyChooseEduFlowAcademy: 'Why Choose EduFlow Academy?',
      
      // Feature Cards
      certifiedLearning: 'Certified Learning',
      certifiedLearningDesc: 'Earn recognized certificates upon course completion',
      expertInstructorsCard: 'Expert Instructors',
      expertInstructorsCardDesc: 'Learn from industry professionals',
      flexibleSchedule: 'Flexible Schedule',
      flexibleScheduleDesc: 'Study at your own pace, anytime, anywhere',
      communitySupport: 'Community Support',
      communitySupportDesc: 'Connect with fellow learners and instructors',
      
      // Success Stories
      realSuccessStories: 'Real success stories from our learning community',
      whatOurStudentsSay: 'What Our Students Say',
      testimonialDescription: 'Real feedback from students who completed our courses and achieved their goals.',
      
      // CTA
      readyToStartLearningJourney: 'Ready to Start Your Learning Journey?',
      joinThousandsOfStudents: 'Join thousands of students already learning with us',
      browseCourses: 'Browse Courses',
      getStartedFree: 'Get Started Free',
      exploreCourses: 'Explore Courses',
      viewCourses: 'View Courses',
      startLearningToday: 'Start Learning Today',
      
      // Instructors
      instructors: 'Instructors',
      viewProfile: 'View Profile',
      coursesBy: 'Courses by',
      noCoursesAvailableYet: 'No courses available yet',
      backToInstructors: 'Back to Instructors',
      eduflow: 'EduFlow',
      
      // Student Dashboard
      continueYourLearningJourney: 'Continue your learning journey and discover new courses',
      enrolledCoursesCard: 'Enrolled Courses',
      completedCoursesCard: 'Completed Courses',
      inProgress: 'In Progress',
      totalProgress: 'Total Progress',
      
      // Course Details
      backToDashboard: 'Back to Dashboard',
      group: 'Group',
      joinDiscussionGroup: 'Join Discussion Group',
      courseSections: 'Course Sections',
      lecturesCount: 'lectures',
      assignmentsCount: 'assignments',
      projectsCount: 'projects',
      lecture: 'Lecture',
      assignment: 'Assignment',
      project: 'Project',
      projectTutorial: 'Project Tutorial Video',
      watchTutorialToUnderstand: 'Watch the tutorial to understand the project requirements',
      watchTutorial: 'Watch Tutorial',
      downloadStarterFiles: 'Download Starter Files',
      
      // Profile Settings
      updatePassword: 'Update Password',
      themePreference: 'Theme',
      choosePreferredTheme: 'Choose your preferred theme',
      switchToLightMode: 'Switch to Light Mode',
      switchToDarkMode: 'Switch to Dark Mode',
      languagePreference: 'Language',
      choosePreferredLanguage: 'Choose your preferred language',
      switchToEnglish: 'Switch to English',
      switchToArabic: 'Switch to Arabic',
      pendingActionsAnimationsLabel: 'Pending actions animations',
      pendingActionsAnimationsDescription: 'Enable subtle animations on pending-action banners in dashboards.',
      pendingActionsAnimationsEnable: 'Enable',
      pendingActionsAnimationsDisable: 'Disable',
      manageAccountSettingsAndPreferences: 'Manage your account settings and preferences',
      profileInformation: 'Profile Information',
      emailCannotBeChanged: 'Email cannot be changed',
      
      // Student Settings
      studentSettings: 'Student Settings',
      manageProfileAndPreferences: 'Manage your profile and preferences',
      profileInformation: 'Profile Information',
      profilePicture: 'Profile Picture',
      avatarPreview: 'Avatar preview',
      chooseImage: 'Choose Image',
      imageRequirements: 'JPG, PNG, GIF or WEBP. Max size: 5MB',
      nameCanOnlyBeChanged: 'Name can only be changed in Profile section',
      emailCannotBeChanged: 'Email cannot be changed',
      phoneCanOnlyBeChanged: 'Phone can only be changed in Profile section',
      jobRole: 'Job Role',
      jobRolePlaceholder: 'e.g., Software Developer, Student, Designer',
      shortBio: 'Short Bio',
      bioBriefIntro: 'A brief introduction...',
      aboutMeDetailed: 'About Me (Detailed)',
      shareMoreAboutYourself: 'Share more about yourself, your learning journey, and goals',
      saveSettings: 'Save Settings',
      dangerZone: 'Danger Zone',
      irreversibleActions: 'Irreversible and destructive actions',
      deleteAccount: 'Delete Account',
      permanentlyDeleteAccount: 'Permanently delete your account and all associated data. This action cannot be undone.',
      deleteMyAccount: 'Delete My Account',
      deleteAccountConfirmTitle: 'Delete Account',
      thisActionPermanent: 'This action is permanent and cannot be undone. All your data including:',
      profileInfo: 'Profile information',
      courseEnrollments: 'Course enrollments',
      certificatesData: 'Certificates',
      progressAndGrades: 'Progress and grades',
      messagesAndNotifications: 'Messages and notifications',
      willBePermanentlyDeleted: 'will be permanently deleted from our servers.',
      typeToConfirm: 'Type',
      deleteMyAccountCaps: 'DELETE MY ACCOUNT',
      toConfirm: 'to confirm',
      deleting: 'Deleting...',
      pleaseTypeToConfirm: 'Please type "DELETE MY ACCOUNT" to confirm',
      failedToLoadProfile: 'Failed to load profile',
      imageMustBeLess5MB: 'Image must be less than 5MB',
      pleaseSelectImage: 'Please select an image file',
      saving: 'Saving...',
      learner: 'Learner',
      shortBio: 'Short Bio',
      briefIntroduction: 'A brief introduction...',
      charactersCount: 'characters',
      aboutMeDetailed: 'About Me (Detailed)',
      shareMoreAboutYourself: 'Share more about yourself, your learning journey, and goals',
      saveSettings: 'Save Settings',
      dangerZone: 'Danger Zone',
      irreversibleActions: 'Irreversible and destructive actions',
      deleteAccount: 'Delete Account',
      permanentlyDeleteAccount: 'Permanently delete your account and all associated data. This action cannot be undone.',
      deleteMyAccount: 'Delete My Account',
      
      // Certificates
      myCertificates: 'My Certificates',
      viewAndRequestCertificates: 'View and request certificates for completed courses',
      issuedCertificates: 'Issued Certificates',
      gradeLabel: 'Grade:',
      grade: 'Grade',
      issued: 'Issued',
      view: 'View',
      download: 'Download',
      rateThisCourse: 'Rate This Course',
      issuedOn: 'Issued on',
      group: 'Group',
      requestCertificate: 'Request Certificate',
      noCertificatesYet: 'No certificates yet',
      completeCoursesWith70: 'Complete courses with a grade of 70% or higher to request certificates',
      noEligibleCourses: 'No eligible courses',
      keepLearningToEarnCertificates: 'Keep learning and complete courses with a grade of 70% or higher to earn certificates',
      requestPending: 'Request Pending',
      requestDenied: 'Request Denied',
      request: 'Request',
      requested: 'Requested',
      rateCourse: 'Rate Course',
      yourRating: 'Your Rating',
      yourReview: 'Your Review (Optional)',
      writeYourReview: 'Write your review here...',
      submitRating: 'Submit Rating',
      cancel: 'Cancel',
      delivered: 'Delivered',
      pending: 'Pending',
      requestAgain: 'Request Again',
      previousRejectionReason: 'Previous rejection reason',
      course: 'Course',
      feedbackHelpsOthers: 'Your feedback helps other students make informed decisions!',
      rating: 'Rating',
      star: 'star',
      stars: 'stars',
      shareYourExperience: 'Share your experience with this course...',
      characters: 'characters',
      skipForNow: 'Skip for Now',
      
      // Certificate eligibility messaging
      certificateStatus: 'Certificate Status',
      certificateStatusEligible: 'Eligible to request now',
      certificateStatusNotEligible: 'Not eligible yet',
      certificateStatusWaitingInstructor: 'Completed but waiting for instructor to open requests',
      certificateStatusCertificatesDisabled: 'Certificates are not available for this course',
      certificateReasonGroupNotCompleted: 'Complete all required lectures, assignments, projects, and tests in this group to become eligible for a certificate.',
      certificateReasonGradeTooLow: 'Your overall grade must reach at least {{passingGrade}}% to be eligible for a certificate.',
      certificateProgressLabel: 'Progress',
      certificateProgressValue: '{{completed}} of {{total}} items ({{percentage}}%) completed',
      certificateModeLabel: 'Certificate mode',
      certificateModeAutomatic: 'Automatic  requests open as soon as you complete the course and meet the passing grade.',
      certificateModeManualInstructor: 'Manual (instructor-controlled)  your instructor decides when to open certificate requests.',
      certificateModeDisabled: 'Disabled  certificates are currently turned off for this course.',
      
      // Static Pages
      privacyPolicyTitle: 'Privacy Policy',
      termsOfServiceTitle: 'Terms of Service',
      aboutUsTitle: 'About Us',
      helpCenterTitle: 'Help Center',
      faqTitle: 'Frequently Asked Questions',
      
      // Course Details Page (Public)
      courseNotFound: 'Course not found',
      backToHome: 'Back to Home',
      groups: 'groups',
      whatYoullLearn: "What you'll learn",
      courseCoversKeyTopics: 'This course covers the key topics to achieve the stated level. Lectures, assignments and projects included.',
      continueCourse: 'Continue course',
      enrollmentPendingApproval: 'Enrollment pending approval',
      selectGroup: 'Select Group',
      chooseAGroup: 'Choose a group',
      continueToEnrollment: 'Continue to Enrollment',
      loginAsStudentToEnroll: 'Login as a student to enroll',
      createAccountOrLogin: 'Create an account or log in to enroll',
      studentReviews: 'Student Reviews',
      noReviewsYet: 'No reviews yet. Be the first to review this course!',
      completeEnrollment: 'Complete Enrollment',
      paymentRequired: 'Payment Required',
      groupRequiresPayment: 'This group requires a',
      monthly: 'monthly',
      perSection: 'per-section',
      paymentOf: 'payment of',
      paymentMethod: 'Payment Method',
      selectPaymentMethod: 'Select payment method',
      haramHawala: 'Haram Hawala',
      fouadHawala: 'Fouad Hawala',
      shamCash: 'Sham Cash',
      westernUnion: 'Western Union',
      paymentReceiptUrl: 'Payment Receipt URL',
      uploadReceiptInstruction: 'Upload your receipt image and paste the URL here, or send via messaging to admin/instructor for verification.',
      canAlsoUploadViaMessages: 'You can also upload your receipt via the',
      messagesPage: 'Messages',
      pageToInstructorOrAdmin: 'page to the instructor or admin.',
      freeGroupEnrollImmediately: 'This is a free group. You can enroll immediately.',
      confirmEnrollment: 'Confirm Enrollment',
      enrolling: 'Enrolling...',
      anonymous: 'Anonymous',
      
      // Student Course Details Page
      overallGrade: 'Overall Grade',
      unlockAllSections: 'Unlock All Sections',
      payForAllLockedSections: 'Pay for all',
      lockedSection: 'locked section',
      lockedSections: 'locked sections',
      atOnce: 'at once',
      pay: 'Pay',
      noContentAvailable: 'No content available',
      lecturesUppercase: 'LECTURES',
      assignmentsUppercase: 'ASSIGNMENTS',
      projectsUppercase: 'PROJECTS',
      selectContentFromLeft: 'Select content from the left to view details',
      clickToWatchVideo: 'Click to watch video',
      videoWillAutoPlay: 'Video will auto-play and track your progress',
      assignmentFile: 'Assignment File',
      downloadAssignment: 'Download Assignment',
      reviewed: 'Reviewed',
      gradeColon: 'Grade:',
      instructorFeedback: 'Instructor Feedback:',
      pendingGrading: 'Pending Grading',
      assignmentSubmittedSuccessfully: 'Your assignment has been submitted successfully and is awaiting instructor review.',
      currentGrade50Pending: 'Current Grade: 50% (will be updated after review)',
      deadlinePassed: 'Deadline Passed',
      assignmentDeadlinePassed: 'The deadline for this assignment has passed.',
      projectDeadlinePassed: 'The deadline for this project has passed.',
      gradeFailed: 'Grade: 0% (Failed)',
      deadlineWas: 'Deadline was:',
      submitYourWork: 'Submit Your Work',
      uploadCompletedAssignmentRar: 'Please upload your completed assignment as a .rar or .zip file',
      deadline: 'Deadline:',
      uploadingAssignment: 'Uploading assignment...',
      projectTutorialVideo: 'Project Tutorial Video',
      watchTutorialToUnderstandRequirements: 'Watch the tutorial to understand the project requirements',
      watchTutorial: 'Watch Tutorial',
      starterFiles: 'Starter Files',
      downloadStarterFiles: 'Download Starter Files',
      projectSubmittedSuccessfully: 'Your project has been submitted successfully and is awaiting instructor review.',
      submitYourProject: 'Submit Your Project',
      uploadCompletedProjectRar: 'Please upload your completed project as a .rar file',
      uploadingProject: 'Uploading project...',
      
      // Help Center Additional
      foundResults: 'Found',
      result: 'result',
      results: 'results',
      all: 'All',
      noResultsFound: 'No results found',
      tryDifferentKeywords: 'Try different keywords or browse all categories',
      stillNeedHelp: 'Still need help?',
      ourSupportTeamIsHere: 'Our support team is here to assist you',
      emailSupport: 'Email Support',
      messageAdmin: 'Message Admin',
      
      // Additional status translations
      notWatched: 'Not Watched',
      watched: 'Watched',
      notSubmitted: 'Not Submitted',
      pendingReview: 'Pending Review',
      completed: 'Completed',
      
      // Help Article Tags
      gettingStarted: 'Getting Started',
      paymentsAndBilling: 'Payments & Billing',
      signup: 'signup',
      enroll: 'enroll',
      apply: 'apply',
      become: 'become',
      setup: 'setup',
      manage: 'manage',
      monitor: 'monitor',
      grading: 'grading',
      evaluation: 'evaluation',
      marks: 'marks',
      method: 'method',
      bank: 'bank',
      moneyBack: 'money back',
      return: 'return',
      cancellation: 'cancellation',
      proof: 'proof',
      issues: 'issues',
      problems: 'problems',
      stuck: 'stuck',
      error: 'error',
      browse: 'browse',
      photo: 'photo',
      homework: 'homework'
    }
  },
  ar: {
    translation: {
      // Help Center UI Elements
      helpCenterTitle: 'مركز المساعدة',
      howCanWeHelpYou: 'كيف يمكننا مساعدتك؟',
      searchForAnswers: 'ابحث عن إجابات أو تصفح المقالات حسب الفئة',
      searchHelp: 'ابحث في مقالات المساعدة...',
      browseCategories: 'تصفح الفئات',
      popularArticles: 'المقالات الشائعة',
      stillNeedHelp: 'لا تزال بحاجة إلى مساعدة؟',
      contactSupport: 'اتصل بالدعم الفني',
      contactUsAt: 'تواصل معنا على',
      or: 'أو',
      sendMessage: 'إرسال رسالة',
      helpCategories: 'فئات المساعدة',
      gettingStarted: 'البدء',
      coursesLearning: 'الدورات والتعلم',
      instructors: 'المدربون',
      payments: 'المدفوعات',
      account: 'الحساب',
      technical: 'الدعم الفني',
      findAnswers: 'ابحث عن إجابات لأسئلتك',
      noResultsFound: 'لم يتم العثور على نتائج',
      tryDifferentKeywords: 'جرب كلمات بحث مختلفة أو تصفح جميع الفئات',
      wasThisHelpful: 'هل كان هذا مفيداً لك؟',
      yes: 'نعم',
      no: 'لا',
      thankYouFeedback: 'شكراً لك على ملاحظاتك!',

      // Student Registration
      enrollInCourse: 'سجل في الدورة',
      selectGroup: 'الرجاء اختيار مجموعة للتسجيل في هذه الدورة',
      noGroupsAvailable: 'لا توجد مجموعات متاحة لهذه الدورة',
      instructor: 'المدرب:',
      notAssigned: 'غير معين',
      students: 'طالب',
      enrollNow: 'سجل الآن',
      cancel: 'إلغاء',
      back: 'عودة',
      group: 'المجموعة',
      level: 'المستوى',
      startDate: 'تاريخ البدء',
      endDate: 'تاريخ الانتهاء',
      maxStudents: 'الحد الأقصى للطلاب',
      currentStudents: 'الطلاب المسجلين',
      price: 'السعر',
      selectGroupToContinue: 'الرجاء اختيار مجموعة للمتابعة',
      enrollmentSuccessful: 'تم التسجيل في الدورة بنجاح!',
      alreadyEnrolled: 'أنت مسجل مسبقاً في هذه الدورة',
      enrollmentPending: 'طلب التسجيل قيد المراجعة',
      enrollmentError: 'حدث خطأ أثناء محاولة التسجيل',
      selectGroupInstruction: 'اختر مجموعة من القائمة للمتابعة',
      groupFull: 'هذه المجموعة ممتلئة',
      groupClosed: 'التسجيل في هذه المجموعة مغلق',
      enrollmentClosed: 'انتهى موعد التسجيل',
      enrollmentNotStarted: 'لم يبدأ التسجيل بعد',
      enrollmentDeadline: 'آخر موعد للتسجيل',

      // Course Details
      backToDashboard: 'العودة للوحة التحكم',
      advanced: 'متقدم',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      lectures: 'المحاضرات',
      projects: 'المشاريع',
      courseSections: 'أقسام الدورة',
      selectContent: 'حدد المحتوى من اليمين لعرض التفاصيل',
      clickToWatch: 'انقر لمشاهدة الفيديو',
      videoAutoPlay: 'سيتم تشغيل الفيديو تلقائياً وتتبع تقدمك',
      assignment: 'الواجب',
      assignmentFile: 'ملف الواجب',
      downloadAssignment: 'تحميل الواجب',
      reviewed: 'تمت المراجعة',
      projectTutorialVideo: 'فيديو تعليمي للمشروع',
      watchTutorial: 'مشاهدة البرنامج التعليمي',
      watchTutorialDesc: 'شاهد البرنامج التعليمي لفهم متطلبات المشروع',
      starterFiles: 'ملفات البداية',
      downloadStarterFiles: 'تحميل ملفات البداية',
      courseContent: 'محتوى الدورة',
      overview: 'نظرة عامة',
      resources: 'الموارد',
      announcements: 'الإعلانات',
      grades: 'الدرجات',
      completed: 'مكتمل',
      inProgress: 'قيد التنفيذ',
      notStarted: 'لم يبدأ بعد',
      markAsComplete: 'وضع علامة كمكتمل',
      viewDetails: 'عرض التفاصيل',
      downloadMaterials: 'تحميل المواد',
      submitAssignment: 'تسليم الواجب',
      dueDate: 'تاريخ الاستحقاق',
      submittedOn: 'تم التسليم في',
      grade: 'الدرجة',
      feedback: 'التعليقات',
      noContentAvailable: 'لا يوجد محتوى متاح حالياً',
      continueLearning: 'واصل التعلم',
      startCourse: 'ابدأ الدورة',
      lastAccessed: 'آخر زيارة',
      courseProgress: 'تقدم الدورة',
      overallGrade: 'المعدل العام',
      assignments: 'الواجبات',
      quizzes: 'الاختبارات',
      discussions: 'المناقشات',
      viewAll: 'عرض الكل',
      recentActivity: 'النشاطات الحديثة',
      noRecentActivity: 'لا توجد أنشطة حديثة',
      section: 'القسم',
      lecture: 'محاضرة',
      video: 'فيديو',
      reading: 'قراءة',
      quiz: 'اختبار',
      project: 'مشروع',
      download: 'تحميل',
      submit: 'تسليم',
      submitted: 'تم التسليم',
      notSubmitted: 'لم يتم التسليم',
      graded: 'تم التقييم',
      pendingReview: 'قيد المراجعة',
      viewSubmission: 'عرض التسليم',
      resubmit: 'إعادة التسليم',
      viewFeedback: 'عرض التعليقات',
      noFeedback: 'لا توجد تعليقات بعد',
      passingGrade: 'الدرجة النهائية',
      yourGrade: 'درجتك',
      averageGrade: 'المعدل',
      highestGrade: 'أعلى درجة',
      lowestGrade: 'أدنى درجة',
      gradeDistribution: 'توزيع الدرجات',
      assignmentDetails: 'تفاصيل الواجب',
      instructions: 'التعليمات',
      submissionStatus: 'حالة التسليم',
      submissionDate: 'تاريخ التسليم',
      timeRemaining: 'الوقت المتبقي',
      lateSubmission: 'تسليم متأخر',
      submissionHistory: 'سجل التسليمات',
      noSubmissionHistory: 'لا يوجد سجل تسليمات سابق',
      downloadSubmission: 'تحميل التسليم',
      // Navigation
      home: 'الرئيسية',
      courses: 'الدورات',
      about: 'حول',
      contact: 'اتصل بنا',
      login: 'تسجيل الدخول',
      register: 'إنشاء حساب',
      logout: 'تسجيل الخروج',
      profile: 'الملف الشخصي',
      messages: 'الرسائل',
      settings: 'الإعدادات',
      certificates: 'الشهادات',
      wishlist: 'المفضلة',
      myWishlist: 'قائمة المفضلة',
      emptyWishlist: 'قائمة المفضلة فارغة',
      saveCoursesForLater: 'ابدأ بإضافة الدورات التي تهمك!',
      browseCourses: 'تصفح الدورات',
      addToWishlist: 'إضافة للمفضلة',
      removeFromWishlist: 'إزالة من المفضلة',
      savedForLater: 'دورة محفوظة للمتابعة لاحقاً',
      myStats: 'إحصائياتي',
      myAchievements: 'إنجازاتي',
      totalPoints: 'إجمالي النقاط',
      currentStreak: 'السلسلة الحالية',
      badgesEarned: 'الأوسمة المكتسبة',
      activityOverview: 'نظرة عامة على النشاط',
      lessonsCompleted: 'الدروس المكتملة',
      quizzesCompleted: 'الاختبارات المكتملة',
      coursesCompleted: 'الدورات المكتملة',
      yourBadges: 'أوسمتك',
      noBadgesYet: 'لم تحصل على أي أوسمة بعد',
      earnBadgesByCompleting: 'أكمل الدروس والاختبارات والدورات للحصول على الأوسمة!',
      dashboard: 'لوحة التحكم',
      
      // Streak and Gamification
      streakDays: 'أيام السلسلة',
      pointsEarned: 'النقاط المكتسبة',
      badgeUnlocked: 'وسام جديد',
      titleEarned: 'لقب جديد',
      keepUpGreatWork: 'استمر في العمل الرائع!',
      amazingStreak: 'سلسلة رائعة! أنت مُلتهب 🔥',
      excellentProgress: 'تقدم ممتاز! 💪',
      everyStepCounts: 'كل خطوة مهمة. استمر في التعلم! 📚',
      
      // My Achievements (Stats) Tour Steps
      achievementsTourWelcomeTitle: 'صفحة إنجازاتك ومكافآتك 🎉',
      achievementsTourWelcomeContent: 'في هذه الصفحة ترى كيف يتحول نشاطك التعليمي إلى نقاط، ورصيد في المحفظة، وأوسمة وألقاب. دعنا نأخذ جولة سريعة لشرح كيفية عمل النظام.',
      achievementsTourHeaderTitle: 'نظرة عامة على الإنجازات',
      achievementsTourHeaderContent: 'في الأعلى يمكنك رؤية لقبك الحالي، وإجمالي نقاطك، وسلسلة الأيام المتتالية، وملخص سريع لتقدمك على المنصّة.',
      achievementsTourPointsTitle: 'النقاط ورصيد المحفظة',
      achievementsTourPointsContent: 'في كل مرة تُكمل محاضرات أو واجبات أو مشاريع أو اختبارات، تحصل على نقاط. يمكن تحويل هذه النقاط إلى رصيد في محفظتك بالليرة السورية حسب سعر التحويل الظاهر هنا، ويمكن استخدام الرصيد لاحقاً للحصول على خصومات أو مكافآت.',
      achievementsTourActivitiesTitle: 'سجل النشاطات الأخيرة',
      achievementsTourActivitiesContent: 'هنا تجد آخر النقاط والأوسمة والألقاب التي حصلت عليها، مع تفاصيل عن الدورة أو الدرس أو الفيديو المرتبط بكل نشاط.',
      achievementsTourBadgesTitle: 'الأوسمة ومسار تقدمك',
      achievementsTourBadgesContent: 'الأوسمة هي مكافآت بصرية تُظهر إنجازاتك، وبعضها يمنحك نقاطاً إضافية. كلما أكملت محتوى أكثر تحصل على أوسمة جديدة وترفع مجموع نقاطك.',
      achievementsTourMotivationTitle: 'المكافآت المستقبلية والتحفيز',
      achievementsTourMotivationContent: 'هذا القسم يذكّرك بأن استمرارك في التعلم سيقربك من مكافآت ونقاط ورصيد أعلى في المحفظة. كل يوم دراسة يساهم في بناء مستقبلك.',

      // Animation Messages
      welcomeBack: 'مرحباً بعودتك',
      letsStartLearning: 'لنبدأ التعلم! 🎓',
      greatStart: 'بداية رائعة!',
      keepGoing: 'واصل المسير!',
      onFire: 'أنت مُلتهب!',
      amazing: 'مذهل!',
      legendary: 'أسطوري!',
      
      // Auth
      email: 'البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      name: 'الاسم',
      phone: 'الهاتف',
      role: 'الدور',
      countryLabel: 'البلد',
      cityLabel: 'المدينة',
      schoolLabel: 'المدرسة / الجامعة (أعلى شهادة)',
      student: 'طالب',
      instructor: 'مدرس',
      admin: 'مدير',
      forgotPassword: 'نسيت كلمة المرور؟',
      rememberMe: 'تذكرني',
      alreadyHaveAccount: 'لديك حساب بالفعل؟',
      dontHaveAccount: 'ليس لديك حساب؟',
      back: 'رجوع',
      iAgreeTo: 'أوافق على',
      andLabel: 'و',
      wantToTeach: 'هل ترغب بالتدريس على إيدوفلو؟',
      becomeInstructor: 'كن مدرّساً',
      instructorAgreementCheckbox: 'لقد قرأت وأوافق على الشروط والأحكام في اتفاقية المدرّس',
      mustAgreeTerms: 'يجب أن توافق على شروط الخدمة وسياسة الخصوصية للمتابعة',
      leaderboard: 'لوحة المتصدرين',
      searchStudents: 'ابحث عن الطلاب بالاسم أو البريد الإلكتروني',
      noStudentsFound: 'لا يوجد طلاب',
      searchLabel: 'بحث',
      
      // Form Placeholders
      enterYourEmail: 'أدخل بريدك الإلكتروني',
      enterYourPassword: 'أدخل كلمة المرور',
      enterYourFullName: 'أدخل اسمك الكامل',
      enterYourCountry: 'أدخل بلدك',
      enterYourCity: 'أدخل مدينتك',
      enterYourSchoolUniversity: 'أدخل اسم مدرستك أو جامعتك',
      
      // Instructor Registration (multi-step)
      instructorRegToastFillRequired: 'يرجى ملء جميع الحقول المطلوبة',
      instructorRegToastPasswordsMismatch: 'كلمتا المرور غير متطابقتين',
      instructorRegToastPasswordMinLength: 'يجب أن تكون كلمة المرور 12 خانة على الأقل وتتضمن حروفاً كبيرة وصغيرة وأرقاماً ورمزاً خاصاً',
      instructorRegToastPasswordRequireLower: 'يجب أن تحتوي كلمة المرور على حرف صغير واحد على الأقل',
      instructorRegToastPasswordRequireUpper: 'يجب أن تحتوي كلمة المرور على حرف كبير واحد على الأقل',
      instructorRegToastPasswordRequireNumber: 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل',
      instructorRegToastPasswordRequireSymbol: 'يجب أن تحتوي كلمة المرور على رمز واحد على الأقل',
      instructorRegToastPhoneInvalid: 'يجب أن يبدأ رقم الهاتف بـ 09 وأن يتكوّن من 10 أرقام بالضبط',
      instructorRegToastExpertiseRequired: 'يرجى اختيار مجال خبرة واحد على الأقل',
      instructorRegToastCustomExpertiseRequired: 'يرجى تحديد مجال الخبرة المخصص',
      instructorRegToastNameLettersOnly: 'يجب أن يحتوي الاسم الكامل على أحرف ومسافات فقط (بدون أرقام أو رموز خاصة)',
      instructorRegToastEnterEmailFirst: 'يرجى إدخال بريدك الإلكتروني أولاً',
      instructorRegConfirmRestartTitle: 'هل أنت متأكد أنك تريد إعادة بدء التسجيل؟ سيتم حذف التقدم الحالي في طلبك.',
      instructorRegToastRestarted: 'تمت إعادة ضبط التسجيل. يمكنك البدء من جديد الآن.',
      instructorRegToastPendingReview: 'طلبك قيد المراجعة حالياً. يرجى انتظار موافقة الإدارة.',
      instructorRegToastApproved: 'تمت الموافقة على طلبك! يرجى تسجيل الدخول.',
      instructorRegToastResumeExisting: 'تم العثور على طلب سابق. يتم الآن استكمال التسجيل من حيث توقّف.',
      instructorRegToastVerificationSent: 'تم إرسال رسالة التحقق! يرجى فحص بريدك الإلكتروني.',
      instructorRegToastRegistrationFailed: 'فشل التسجيل. يرجى المحاولة مرة أخرى.',
      instructorRegConfirmResumeExisting: 'لديك تسجيل غير مكتمل. هل ترغب في إعادة البدء من البداية؟',
      instructorRegToastEnterOTP: 'يرجى إدخال رمز التحقق',
      instructorRegToastEmailVerified: 'تم التحقق من البريد الإلكتروني بنجاح!',
      instructorRegToastVerificationFailed: 'فشل التحقق. يرجى المحاولة مرة أخرى.',
      instructorRegToastAgreeTerms: 'يرجى الموافقة على الشروط للمتابعة',
      instructorRegToastSignatureRequired: 'يرجى إدخال توقيعك',
      instructorRegToastSignatureLettersOnly: 'يجب أن يحتوي التوقيع على أحرف ومسافات فقط (بدون أرقام أو رموز خاصة)',
      instructorRegToastSignatureMustMatchName: 'يجب أن يطابق التوقيع الاسم الكامل تمامًا كما تم إدخاله في الحقل السابق',
      instructorRegToastAgreementSigned: 'تم توقيع الاتفاقية بنجاح!',
      instructorRegToastAgreementFailed: 'فشل إنشاء الاتفاقية. يرجى المحاولة مرة أخرى.',
      instructorRegToastVideoRequired: 'يرجى رفع فيديو التعريف الخاص بك',
      instructorRegToastVideoSaved: 'تم حفظ الفيديو بنجاح!',
      instructorRegToastVideoSaveFailed: 'فشل حفظ الفيديو. يرجى المحاولة مرة أخرى.',
      instructorRegToastAgreementLoadFailed: 'فشل تحميل نص الاتفاقية',
      instructorRegToastRestartFailed: 'فشل إعادة بدء التسجيل. يرجى المحاولة مرة أخرى.',
      instructorRegStepLabel: 'الخطوة {{current}} من {{total}}',
      instructorRegProgressPercent: '{{percent}}٪ مكتمل',
      instructorRegStep1Title: 'المعلومات الشخصية',
      instructorRegStep1Subtitle: 'أخبرنا عن نفسك',
      instructorRegFullNameLabel: 'الاسم الكامل *',
      instructorRegFullNamePlaceholder: 'اكتب اسمك الكامل',
      instructorRegEmailLabel: 'البريد الإلكتروني *',
      instructorRegEmailPlaceholder: 'example@example.com',
      instructorRegPasswordLabel: 'كلمة المرور *',
      instructorRegPasswordPlaceholder: '••••••••',
      instructorRegConfirmPasswordLabel: 'تأكيد كلمة المرور *',
      instructorRegConfirmPasswordPlaceholder: '••••••••',
      instructorRegPhoneLabel: 'رقم الهاتف * (09XXXXXXXX)',
      instructorRegPhonePlaceholder: '0912345678',
      instructorRegExpertiseLabel: 'مجالات الخبرة * (اختر واحداً على الأقل)',
      instructorRegCustomExpertiseLabel: 'يرجى تحديد مجال خبرتك',
      instructorRegCustomExpertisePlaceholder: 'أدخل مجال خبرتك',
      instructorRegStep2Title: 'تحقق من بريدك الإلكتروني',
      instructorRegStep2Subtitle: 'قمنا بإرسال رمز تحقق إلى {{email}}',
      instructorRegVerificationCodeLabel: 'رمز التحقق',
      instructorRegVerificationCodePlaceholder: '000000',
      instructorRegResendCode: 'إعادة إرسال رمز التحقق',
      instructorRegStep3Title: 'اتفاقية المدرّس',
      instructorRegStep3Subtitle: 'راجع الاتفاقية ووقّعها',
      instructorRegRevenueSharingTitle: 'تقسيم الأرباح',
      instructorRegYourShareLabel: 'نصيبك',
      instructorRegPlatformShareLabel: 'نصيب المنصة',
      instructorRegAgreementHeading: 'اتفاقية المدرّس',
      instructorRegSignatureLabel: 'التوقيع (اكتب اسمك الكامل)',
      instructorRegSignaturePlaceholder: 'اكتب اسمك الكامل كتوقيع',
      instructorRegStep4Title: 'فيديو المقدّمة',
      instructorRegStep4Subtitle: 'قم برفع فيديو قصير لتقديم نفسك',
      instructorRegVideoInstructions: 'قم برفع فيديو مقدّمة (الحد الأقصى للحجم {{maxSize}} ميجابايت)',
      instructorRegVideoSizeTooLarge: 'يجب أن يكون حجم الفيديو أقل من {{maxSize}} ميجابايت',
      instructorRegUploadingVideo: 'جاري رفع الفيديو...',
      instructorRegUploadingVideoPercent: 'جاري الرفع... {{percent}}٪',
      instructorRegChooseVideoLabel: 'اختر الفيديو',
      instructorRegVideoUploadedLabel: 'تم رفع الفيديو بنجاح!',
      instructorRegStep5Title: 'تم إرسال الطلب!',
      instructorRegStep5Subtitle: 'شكراً لتقديم طلبك لتصبح مدرّساً على إيدوفلو. سيقوم فريقنا بمراجعة ملفك واتفاقيتك وفيديو المقدّمة، وستصلك رسالة بالبريد الإلكتروني عند الموافقة.',
      instructorRegGoToLogin: 'الانتقال إلى تسجيل الدخول',
      
      // Instructor expertise labels
      instructorRegExpertiseProgramming: 'البرمجة',
      instructorRegExpertiseWebDevelopment: 'تطوير الويب',
      instructorRegExpertiseMobileDevelopment: 'تطوير تطبيقات الموبايل',
      instructorRegExpertiseDataScience: 'علم البيانات',
      instructorRegExpertiseMachineLearning: 'تعلّم الآلة',
      instructorRegExpertiseCybersecurity: 'الأمن السيبراني',
      instructorRegExpertiseCloudComputing: 'الحوسبة السحابية',
      instructorRegExpertiseDevOps: 'ديف أوبس',
      instructorRegExpertiseUIUX: 'تصميم واجهات وتجربة المستخدم',
      instructorRegExpertiseDigitalMarketing: 'التسويق الرقمي',
      instructorRegExpertiseBusiness: 'الأعمال',
      instructorRegExpertiseLanguages: 'اللغات',
      instructorRegExpertiseOther: 'أخرى',
      
      // Rating System
      rateCourse: 'قيّم الدورة',
      rateThisCourse: 'قيّم هذه الدورة',
      rating: 'التقييم',
      yourReview: 'مراجعتك',
      shareYourExperience: 'شارك تجربتك مع هذه الدورة',
      submitRating: 'إرسال التقييم',
      skipForNow: 'تخطي الآن',
      star: 'نجمة',
      stars: 'نجوم',
      characters: 'حرف',
      course: 'الدورة',
      feedbackHelpsOthers: 'ملاحظاتك تساعد المتعلمين الآخرين',
      
      // Homepage
      welcomeTitle: 'مرحباً بك في أكاديمية إيدوفلو',
      welcomeSubtitle: 'تعلم البرمجة واللغات مع أفضل المدربين',
      getStarted: 'ابدأ الآن',
      learnMore: 'اعرف المزيد',
      recentCourses: 'الدورات الحديثة',
      allCourses: 'جميع الدورات',
      searchCourses: 'البحث في الدورات',
      filterBy: 'تصفية حسب',
      category: 'الفئة',
      level: 'المستوى',
      programming: 'البرمجة',
      language: 'اللغة',
      beginner: 'مبتدئ',
      intermediate: 'متوسط',
      advanced: 'متقدم',
      
      // Course
      courseDetails: 'تفاصيل الدورة',
      enrollNow: 'سجل الآن',
      continueCourse: 'متابعة الدورة',
      registerForCourse: 'التسجيل في الدورة',
      courseName: 'اسم الدورة',
      duration: 'المدة',
      cost: 'التكلفة',
      description: 'الوصف',
      whatYouWillLearn: 'ما سوف تتعلمه',
      requirements: 'المتطلبات',
      lectures: 'المحاضرات',
      assignments: 'الواجبات',
      projects: 'المشاريع',
      certificate: 'الشهادة',
      
      // Student Dashboard
      myCourses: 'دوراتي',
      enrolledCourses: 'الدورات المسجلة',
      pendingCourses: 'الدورات المعلقة',
      completedCourses: 'الدورات المكتملة',
      discoverNewCourses: 'اكتشف دورات جديدة',
      noCoursesYet: 'لا توجد دورات بعد',
      startLearning: 'ابدأ التعلم',
      progress: 'التقدم',
      viewCourse: 'عرض الدورة',
      
      // Instructor Dashboard
      myTeaching: 'تدريسي',
      createCourse: 'إنشاء دورة',
      manageStudents: 'إدارة الطلاب',
      gradeAssignments: 'تقييم الواجبات',
      uploadContent: 'رفع المحتوى',
      
      // Admin Dashboard
      manageUsers: 'إدارة المستخدمين',
      manageCourses: 'إدارة الدورات',
      manageGroups: 'إدارة المجموعات',
      approveEnrollments: 'الموافقة على التسجيلات',
      systemSettings: 'إعدادات النظام',
      
      // Common
      save: 'حفظ',
      cancel: 'إلغاء',
      edit: 'تعديل',
      delete: 'حذف',
      submit: 'إرسال',
      upload: 'رفع',
      download: 'تحميل',
      view: 'عرض',
      watch: 'مشاهدة',
      read: 'قراءة',
      completed: 'مكتمل',
      pending: 'معلق',
      submitted: 'تم التسليم',
      graded: 'تم التقييم',
      notCompleted: 'غير مكتمل',
      
      // Messages
      sendMessage: 'إرسال رسالة',
      newMessage: 'رسالة جديدة',
      inbox: 'صندوق الوارد',
      sent: 'المرسل',
      notifications: 'الإشعارات',
      
      // Settings
      accountSettings: 'إعدادات الحساب',
      preferences: 'التفضيلات',
      changePassword: 'تغيير كلمة المرور',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      confirmNewPassword: 'تأكيد كلمة المرور الجديدة',

      // Profile email/phone change & username rules
      changeEmail: 'تغيير البريد الإلكتروني',
      changePhoneNumber: 'تغيير رقم الهاتف',
      verifyEmail: 'تأكيد البريد الإلكتروني',
      enterVerificationCode: 'أدخل رمز التحقق',
      verificationCode: 'رمز التحقق',
      sendVerificationCode: 'إرسال رمز التحقق',
      verificationCodeSent: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني الجديد',
      verificationCodeSentHint: 'تم إرسال رمز تحقق إلى بريدك الإلكتروني الجديد وصالح لمدة 10 دقائق.',
      sendingCode: 'جاري إرسال الرمز...',
      verifying: 'جاري التحقق...',
      emailChangedSuccessfully: 'تم تغيير البريد الإلكتروني بنجاح',
      youHaveAlreadyChangedEmailOnce: 'لقد قمت بتغيير بريدك الإلكتروني مرة واحدة من قبل',
      phoneChangedSuccessfully: 'تم تحديث رقم الهاتف بنجاح',
      youHaveAlreadyChangedPhoneNumber: 'لقد قمت بتغيير رقم هاتفك مرة واحدة من قبل',
      phoneNumberAlreadyExists: 'رقم الهاتف مستخدم بالفعل',
      phoneMustStartWith09: 'يجب أن يبدأ رقم الهاتف بـ 09 وأن يتكوّن من 10 أرقام',
      failedToSendVerificationCode: 'فشل في إرسال رمز التحقق',
      failedToVerifyEmail: 'فشل في تأكيد تغيير البريد الإلكتروني',
      verificationCodeExpired: 'انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد.',
      invalidVerificationCode: 'رمز التحقق غير صحيح',
      failedToChangePhone: 'فشل في تغيير رقم الهاتف',
      newEmail: 'البريد الإلكتروني الجديد',
      enterNewEmail: 'أدخل بريدك الإلكتروني الجديد',
      enterNewPhone: 'أدخل رقم هاتفك الجديد (09xxxxxxxx)',
      confirmPhoneChange: 'تأكيد تغيير رقم الهاتف',
      updating: 'جاري التحديث...',
      youCanRequestNewCodeIn: 'يمكنك طلب رمز جديد بعد {{seconds}} ثانية.',
      invalidEmailFormat: 'يرجى إدخال بريد إلكتروني صالح.',
      emailChangeableOnce: 'البريد الإلكتروني (يمكن تغييره مرة واحدة فقط)',
      phoneChangeableOnce: 'رقم الهاتف (يمكن تغييره مرة واحدة فقط)',
      emailChangesRemaining: 'مرات تغيير البريد المتبقية',
      phoneChangesRemaining: 'مرات تغيير الهاتف المتبقية',
      studentEmailUsernameWarning: 'ملاحظة: يمكنك تغيير بريدك الإلكتروني مرة واحدة فقط. يظهر اسم المستخدم على الشهادات، لذلك تأكد من أنه صحيح قبل طلب أي تغييرات.',
      instructorPublicInfoWarning: 'تحذير: بريدك الإلكتروني واسم المستخدم وفيديو التعريف الخاص بك ظاهرة بشكل عام للطلاب. يرجى التأكد من أن المعلومات دقيقة ومناسبة.',
      adminOnlyCanChangeUsername: 'يمكن للمشرف فقط تغيير اسم المستخدم',
      resetChangeLimitsConfirm: 'هل تريد إعادة تعيين حدود تغيير البريد الإلكتروني ورقم الهاتف للمستخدم {{name}}؟ هذا سيسمح له بتغيير البريد والهاتف مرة أخرى.',
      resetChangeLimitsSuccess: 'تمت إعادة تعيين حدود تغيير البريد والهاتف بنجاح.',
      resetChangeLimitsFailed: 'فشل في إعادة تعيين حدود تغيير البريد والهاتف.',
      resetChangeLimitsTooltip: 'إعادة تعيين حدود تغيير البريد/الهاتف',
      emailChangeLimitReached: 'لقد وصلت إلى الحد الأقصى لتغيير البريد الإلكتروني.',
      phoneChangeLimitReached: 'لقد وصلت إلى الحد الأقصى لتغيير رقم الهاتف.',
      emailChangeLimitReachedDescription: 'يمكنك تغيير بريدك الإلكتروني مرة واحدة فقط. إذا كنت تحتاج لتغييره مرة أخرى، يرجى التواصل مع المشرف.',
      phoneChangeLimitReachedDescription: 'يمكنك تغيير رقم هاتفك مرة واحدة فقط. إذا كنت تحتاج لتغييره مرة أخرى، يرجى التواصل مع المشرف.',
      emailChangeLimitReset: 'تمت إعادة تعيين حد تغيير البريد الإلكتروني بنجاح.',
      phoneChangeLimitReset: 'تمت إعادة تعيين حد تغيير رقم الهاتف بنجاح.',
      emailChangeLimitResetFailed: 'فشل في إعادة تعيين حد تغيير البريد الإلكتروني.',
      phoneChangeLimitResetFailed: 'فشل في إعادة تعيين حد تغيير رقم الهاتف.',

      // Errors
      error: 'خطأ',
      success: 'نجح',
      warning: 'تحذير',
      info: 'معلومات',
      somethingWentWrong: 'حدث خطأ ما',
      tryAgain: 'حاول مرة أخرى',
      retry: 'إعادة المحاولة',
      videoNetworkError: 'خطأ في الشبكة، يرجى المحاولة مرة أخرى.',
      videoApiLoadTimeout: 'انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى.',
      videoApiLoadFailed: 'فشل تحميل مشغل الفيديو، يرجى المحاولة مرة أخرى.',
      loading: 'جاري التحميل...',
      processing: 'جاري المعالجة...',
      completeLabel: 'إنهاء',
      continueLabel: 'متابعة',
      
      // Time
      weeks: 'أسابيع',
      days: 'أيام',
      hours: 'ساعات',
      minutes: 'دقائق',
      
      // Currency
      currency: 'ر.س',
      
      // Additional translations for all pages
      welcome: 'مرحباً',
      exploreCourses: 'استكشف الدورات',
      viewCourses: 'عرض الدورات',
      startLearningToday: 'ابدأ التعلم اليوم',
      learnFromExperts: 'تعلم من الخبراء',
      advanceYourCareer: 'طور مسيرتك المهنية',
      masterNewSkills: 'أتقن مهارات جديدة مع مدربين رائدين في الصناعة',
      gainInDemandSkills: 'اكتسب المهارات المطلوبة واحصل على شهادات معترف بها',
      paymentVerification: 'التحقق من الدفع',
      verifyStudentPayments: 'التحقق من مدفوعات الطلاب',
      assignmentGrading: 'تقييم الواجبات',
      gradePendingSubmissions: 'تقييم الواجبات المعلقة',
      amount: 'المبلغ',
      method: 'الطريقة',
      receipt: 'الإيصال',
      approve: 'قبول',
      reject: 'رفض',
      noPendingPayments: 'لا توجد مدفوعات معلقة',
      noPendingSubmissions: 'لا توجد واجبات معلقة',
      allPaymentsProcessed: 'تم معالجة جميع المدفوعات',
      allAssignmentsGraded: 'تم تقييم جميع الواجبات',
      grade: 'الدرجة',
      submitGrade: 'إرسال الدرجة',
      downloadStudentSubmission: 'تحميل واجب الطالب',
      submittedOn: 'تم الإرسال في',
      pendingGrading: 'في انتظار التقييم',
      reviewed: 'تمت المراجعة',
      notWatched: 'لم تتم المشاهدة',
      watched: 'تمت المشاهدة',
      pendingReview: 'في انتظار المراجعة',
      notSubmitted: 'لم يتم الإرسال',
      instructorFeedback: 'ملاحظات المدرب',
      currentGrade: 'الدرجة الحالية',
      willBeUpdatedAfterReview: 'سيتم التحديث بعد المراجعة',
      clickToWatchVideo: 'انقر لمشاهدة الفيديو',
      downloadAssignment: 'تحميل الواجب',
      submitYourWork: 'أرسل عملك',
      submitYourProject: 'أرسل مشروعك',
      uploadCompletedAssignment: 'يرجى تحميل واجبك المكتمل كملف .rar',
      uploadCompletedProject: 'يرجى تحميل مشروعك المكتمل كملف .rar',
      uploadingAssignment: 'جاري رفع الواجب...',
      uploadingProject: 'جاري رفع المشروع...',
      assignmentFile: 'ملف الواجب',
      starterFiles: 'الملفات الأولية',
      projectTutorialVideo: 'فيديو تعليمي للمشروع',
      selectContentToView: 'اختر محتوى من اليسار لعرض التفاصيل',
      directContact: 'اتصال مباشر',
      yourInstructors: 'مدربيك',
      searchMessages: 'البحث في الرسائل...',
      noMessagesInInbox: 'لا توجد رسائل في صندوق الوارد',
      compose: 'إنشاء',
      recipient: 'المستلم',
      subject: 'الموضوع',
      message: 'الرسالة',
      send: 'إرسال',
      manageMessagesAndNotifications: 'إدارة الرسائل والإشعارات',
      
      // Footer
      footerTagline: 'نمكّن المتعلمين في جميع أنحاء العالم',
      quickLinks: 'روابط سريعة',
      support: 'الدعم',
      legal: 'القانونية',
      helpCenter: 'مركز المساعدة',
      faq: 'الأسئلة الشائعة',
      privacyPolicy: 'سياسة الخصوصية',
      termsOfService: 'شروط الخدمة',
      allRightsReserved: 'جميع الحقوق محفوظة',
      followUs: 'تابعنا',
      categories: 'الفئات',
      levels: 'المستويات',
      contactInfo: 'معلومات الاتصال',
      
      // Homepage Sections
      whyChooseUs: 'لماذا تختار أكاديمية إيدوفلو؟',
      discoverBenefits: 'اكتشف فوائد التعلم مع منصتنا',
      expertInstructors: 'مدربون خبراء',
      expertInstructorsDesc: 'تعلم من محترفين في الصناعة بخبرة سنوات',
      learnFromIndustryExperts: 'تعلم من محترفين في الصناعة لديهم سنوات من الخبرة',
      certificatesAwarded: 'شهادات معتمدة',
      earnRecognizedCertificates: 'احصل على شهادات معترف بها عند إتمام الدورة',
      interactiveLearning: 'تعلم تفاعلي',
      engageWithPeers: 'تفاعل مع الزملاء والمدربين في الوقت الفعلي',
      careerGrowth: 'نمو مهني',
      advanceYourCareerPath: 'طور مسيرتك المهنية بمهارات مطلوبة في السوق',
      flexibleSchedule: 'جدول مرن',
      learnAtYourOwnPace: 'تعلم بالسرعة التي تناسبك، في أي وقت وفي أي مكان',
      globalCommunity: 'مجتمع عالمي',
      joinLearnersWorldwide: 'انضم إلى آلاف المتعلمين حول العالم',
      richContent: 'محتوى غني',
      accessComprehensiveMaterials: 'احصل على مواد تعليمية شاملة',
      goalOriented: 'موجه نحو الأهداف',
      achieveYourLearningGoals: 'مسارات منظمة لتحقيق أهدافك',
      joinThousandsOfLearners: 'انضم إلى آلاف المتعلمين الذين يحولون حياتهم المهنية',
      flexibleLearning: 'تعلم مرن',
      flexibleLearningDesc: 'ادرس بوتيرتك الخاصة، في أي وقت، في أي مكان',
      certifiedCourses: 'دورات معتمدة',
      certifiedCoursesDesc: 'احصل على شهادات معترف بها عند إتمام الدورة',
      affordablePricing: 'أسعار معقولة',
      affordablePricingDesc: 'تعليم عالي الجودة بأسعار تنافسية',
      readyToStart: 'هل أنت مستعد لبدء رحلة التعلم؟',
      readyToStartDesc: 'انضم إلى آلاف الطلاب الذين يتعلمون معنا بالفعل',
      whatStudentsSay: 'ماذا يقول طلابنا',
      paymentMethods: 'طرق الدفع',
      weAccept: 'نقبل',
      securePayment: 'معالجة دفع آمنة',
      
      // About Page
      aboutUsTitle: 'من نحن',
      ourMission: 'مهمتنا',
      ourMissionDesc: 'توفير تعليم جيد وسهل الوصول للجميع في كل مكان، وتمكين المتعلمين من تحقيق أهدافهم.',
      ourVision: 'رؤيتنا',
      ourVisionDesc: 'أن نكون منصة التعليم عبر الإنترنت الرائدة في العالم، نحول الحياة من خلال التعلم.',
      ourValues: 'قيمنا',
      ourTeam: 'فريقنا',
      aboutEduFlow: 'حول إيدوفلو',
      aboutDescription: 'أكاديمية إيدوفلو هي منصة تعليمية رائدة عبر الإنترنت مخصصة لتوفير تعليم عالي الجودة للطلاب في جميع أنحاء العالم.',
      meetOurTeam: 'تعرف على فريقنا',
      quality: 'الجودة',
      qualityDesc: 'نحافظ على أعلى معايير التعليم',
      innovation: 'الابتكار',
      innovationDesc: 'نحسن منصتنا وتجربة التعلم باستمرار',
      accessibility: 'إمكانية الوصول',
      accessibilityDesc: 'التعليم للجميع في كل مكان وفي أي وقت',
      community: 'المجتمع',
      communityDesc: 'بناء مجتمع تعليمي داعم',
      
      // Help Center
      helpCenterTitle: 'كيف يمكننا مساعدتك؟',
      searchHelp: 'ابحث عن المساعدة',
      popularTopics: 'المواضيع الشائعة',
      gettingStarted: 'البدء',
      accountManagement: 'إدارة الحساب',
      coursesAndLearning: 'الدورات والتعلم',
      paymentsAndBilling: 'المدفوعات والفواتير',
      technicalSupport: 'الدعم الفني',
      
      // FAQ
      faqTitle: 'الأسئلة الشائعة',
      frequentlyAskedQuestions: 'الأسئلة المتكررة',
      findAnswersToCommonQuestions: 'اعثر على إجابات سريعة للأسئلة الشائعة حول أكاديمية إيدوفلو',
      searchQuestions: 'ابحث عن الأسئلة...',
      noQuestionsFound: 'لم يتم العثور على أسئلة تطابق بحثك.',
      didntFindLookingFor: 'لم تجد ما تبحث عنه؟',
      contactSupportTeam: 'اتصل بفريق الدعم لدينا وسنكون سعداء بالمساعدة',
      general: 'عام',
      coursesAndLearning: 'الدورات والتعلم',
      paymentsAndRefunds: 'المدفوعات والاستردادات',
      forInstructors: 'للمدرسين',
      technicalSupport: 'الدعم الفني',
      
      // FAQ Questions & Answers (Arabic)
      faqQ1: 'ما هي أكاديمية إيدوفلو؟',
      faqA1: 'أكاديمية إيدوفلو هي منصة تعليمية عبر الإنترنت تقدم دورات في البرمجة واللغات يدرسها خبراء في المجال. نحن نقدم تعليماً شاملاً لمساعدتك على تطوير مسيرتك المهنية أو تعلم مهارات جديدة.',
      faqQ2: 'كيف أنشئ حساباً؟',
      faqA2: 'انقر على زر "إنشاء حساب" في الزاوية العلوية اليمنى، اختر دورك (طالب أو مدرس)، املأ بياناتك، وتحقق من عنوان بريدك الإلكتروني. بعد ذلك يمكنك البدء في استكشاف الدورات فوراً.',
      faqQ3: 'هل أكاديمية إيدوفلو مجانية؟',
      faqA3: 'نحن نقدم دورات مجانية ومدفوعة. الدورات المجانية توفر محتوى أساسياً، بينما الدورات المدفوعة تشمل ميزات متميزة وشهادات ودعماً شخصياً من المدرسين.',
      faqQ4: 'كيف أسجل في دورة؟',
      faqA4: 'تصفح كتالوج الدورات لدينا، انقر على دورة تهمك، ثم انقر على زر "سجل الآن". بالنسبة للدورات المدفوعة، أكمل عملية الدفع. أما الدورات المجانية فستتم التسجيل فيها فوراً.',
      faqQ5: 'هل يمكنني الوصول إلى محتوى الدورة بعد إتمامها؟',
      faqA5: 'نعم! بمجرد التسجيل في دورة، ستحصل على وصول مدى الحياة لجميع مواد الدورة، بما في ذلك التحديثات المستقبلية والمحتوى الإضافي الذي يضيفه المدرس.',
      faqQ6: 'كيف أتتبع تقدمي؟',
      faqA6: 'يتم تتبع تقدمك تلقائياً عند إكمال الدروس والواجبات والمشاريع. يمكنك عرض تقدمك على لوحة التحكم الخاصة بك وداخل كل دورة.',
      faqQ7: 'ماذا لو تأخرت في الدورة؟',
      faqA7: 'جميع الدورات ذاتية السرعة، لذا يمكنك التعلم بالسرعة التي تناسبك. لا توجد مواعيد نهائية لمعظم الدورات، مما يتيح لك الموازنة بين التعلم والتزاماتك الأخرى.',
      faqQ8: 'ما هي طرق الدفع التي تقبلونها؟',
      faqA8: 'نحن نقبل طرق دفع متعددة بما في ذلك تحويلات الحوالة، شام كاش، ويسترن يونيون، وخيارات دفع محلية أخرى. اختر الطريقة المفضلة لديك أثناء الدفع.',
      faqQ9: 'كيف أرسل إيصال الدفع؟',
      faqA9: 'بعد اختيار طريقة الدفع الخاصة بك، ستُطلب منك تحميل إيصال الدفع. يمكنك سحب الملف وإفلاته أو النقر للتصفح. الصيغ المقبولة هي JPG و PNG و PDF.',
      faqQ10: 'ما هي سياسة الاسترداد لديكم؟',
      faqA10: 'نحن نقدم ضماناً لاسترداد الأموال لمدة 30 يوماً لجميع الدورات المدفوعة. إذا لم تكن راضياً عن الدورة، اتصل بفريق الدعم لدينا خلال 30 يوماً من التسجيل للحصول على استرداد كامل.',
      faqQ11: 'كم من الوقت يستغرق التحقق من الدفع؟',
      faqA11: 'يستغرق التحقق من الدفع عادةً من 24 إلى 48 ساعة. ستتلقى إشعاراً بالبريد الإلكتروني بمجرد التحقق من دفعتك ويمكنك الوصول إلى محتوى الدورة.',
      faqQ12: 'كيف أصبح مدرساً؟',
      faqA12: 'سجل للحصول على حساب مدرس، أكمل ملفك الشخصي بخبرتك ومعرفتك، وقدم طلباً. سيقوم فريقنا بمراجعة طلبك والموافقة على المدرسين المؤهلين.',
      faqQ13: 'ما الذي أحتاجه لإنشاء دورة؟',
      faqA13: 'ستحتاج إلى محتوى الدورة (فيديوهات، واجبات، مشاريع)، ومخطط للدورة، ومعرفة بموضوعك. نحن نوفر أدوات لتحميل الفيديوهات وإنشاء الواجبات وإدارة تسجيل الطلاب.',
      faqQ14: 'كيف أربح المال كمدرس؟',
      faqA14: 'يكسب المدرسون إيرادات من تسجيلات الدورات. أنت تحدد أسعار دوراتك، ونحن نتعامل مع معالجة الدفع. يتم تحويل الأرباح إلى حسابك على أساس شهري.',
      faqQ15: 'هل يمكنني التفاعل مع طلابي؟',
      faqA15: 'بالتأكيد! يمكنك التواصل مع الطلاب من خلال نظام المراسلة لدينا، وتقييم واجباتهم بتعليقات، والمشاركة في مناقشات الدورة.',
      faqQ16: 'ماذا لو لم تعمل مقاطع الفيديو؟',
      faqA16: 'تأكد من أن لديك اتصال إنترنت مستقر واستخدم متصفحاً محدثاً (Chrome أو Firefox أو Safari أو Edge). امسح ذاكرة التخزين المؤقت وملفات تعريف الارتباط في متصفحك إذا استمرت المشاكل. اتصل بالدعم إذا استمرت المشاكل.',
      faqQ17: 'كيف أقوم بتنزيل مواد الدورة؟',
      faqA17: 'انتقل إلى صفحة محتوى الدورة وانقر على أيقونة التنزيل بجوار أي مادة قابلة للتنزيل (ملفات PDF، ملفات كود، إلخ). سيتم حفظ الملفات في مجلد التنزيلات الافتراضي الخاص بك.',
      faqQ18: 'هل يمكنني الوصول إلى الدورات على الأجهزة المحمولة؟',
      faqA18: 'نعم! منصتنا متجاوبة بالكامل وتعمل على الهواتف الذكية والأجهزة اللوحية. استخدم أي متصفح محمول حديث للوصول إلى دوراتك أثناء التنقل.',
      faqQ19: 'ماذا يجب أن أفعل إذا واجهت خطأ؟',
      faqA19: 'التقط لقطة شاشة لرسالة الخطأ، لاحظ ما كنت تفعله عندما حدث، واتصل بفريق الدعم لدينا عبر البريد الإلكتروني أو مركز المساعدة مع هذه التفاصيل.',
      
      // Privacy Policy
      privacyPolicyTitle: 'سياسة الخصوصية',
      lastUpdated: 'آخر تحديث',
      privacyIntro: 'خصوصيتك وأمان بياناتك هما أولويتنا القصوى',
      introduction: 'مقدمة',
      privacyIntroText: 'في أكاديمية إيدوفلو، نحن ملتزمون بحماية معلوماتك الشخصية وحقك في الخصوصية. توضح سياسة الخصوصية هذه المعلومات التي نجمعها وكيفية استخدامها وما لديك من حقوق فيما يتعلق بها. باستخدام منصتنا، فإنك توافق على جمع المعلومات واستخدامها وفقاً لهذه السياسة.',
      
      informationWeCollect: 'المعلومات التي نجمعها',
      infoCollect1: 'المعلومات الشخصية (الاسم، البريد الإلكتروني، رقم الهاتف) المقدمة أثناء التسجيل',
      infoCollect2: 'معلومات الدفع لشراء الدورات',
      infoCollect3: 'بيانات تقدم الدورة ونشاط التعلم',
      infoCollect4: 'بيانات الاتصال من خلال نظام المراسلة لدينا',
      infoCollect5: 'معلومات الجهاز وبيانات الاستخدام لتحسين المنصة',
      
      howWeUseInfo: 'كيف نستخدم معلوماتك',
      useInfo1: 'لتقديم خدماتنا التعليمية والحفاظ عليها',
      useInfo2: 'لمعالجة المدفوعات ومنع الاحتيال',
      useInfo3: 'لإرسال تحديثات الدورات والإشعارات المهمة',
      useInfo4: 'لتحسين منصتنا وتجربة المستخدم',
      useInfo5: 'للامتثال للالتزامات القانونية',
      
      dataSecurity: 'كيف نحمي بياناتك',
      security1: 'تشفير معياري للصناعة لنقل البيانات',
      security2: 'خوادم آمنة مع عمليات تدقيق أمنية منتظمة',
      security3: 'وصول محدود للبيانات الشخصية من قبل الموظفين المصرح لهم فقط',
      security4: 'نسخ احتياطية منتظمة لمنع فقدان البيانات',
      security5: 'الامتثال للوائح حماية البيانات الدولية',
      
      yourRights: 'حقوقك',
      rights1: 'الوصول إلى بياناتك الشخصية في أي وقت',
      rights2: 'طلب تصحيح المعلومات غير الدقيقة',
      rights3: 'طلب حذف حسابك وبياناتك',
      rights4: 'إلغاء الاشتراك في الاتصالات التسويقية',
      rights5: 'تصدير بياناتك بتنسيق محمول',
      
      dataSharing: 'مشاركة البيانات',
      sharing1: 'نحن لا نبيع معلوماتك الشخصية لأطراف ثالثة',
      sharing2: 'قد نشارك البيانات مع معالجات الدفع للمعاملات',
      sharing3: 'قد تتم مشاركة بيانات إكمال الدورة مع المدرسين',
      sharing4: 'قد نكشف عن المعلومات إذا كان ذلك مطلوباً بموجب القانون',
      sharing5: 'قد تُستخدم بيانات التحليلات المجهولة للبحث',
      
      cookiesAndTracking: 'ملفات تعريف الارتباط والتتبع',
      cookies1: 'نستخدم ملفات تعريف الارتباط الأساسية لوظائف المنصة',
      cookies2: 'تساعدنا ملفات تعريف الارتباط التحليلية على تحسين تجربة المستخدم',
      cookies3: 'يمكنك تعطيل ملفات تعريف الارتباط في إعدادات المتصفح',
      cookies4: 'قد لا تعمل بعض الميزات بدون ملفات تعريف الارتباط',
      cookies5: 'نحن لا نستخدم ملفات تعريف ارتباط إعلانية من طرف ثالث',
      
      contactUsAboutPrivacy: 'اتصل بنا بخصوص الخصوصية',
      privacyContactText: 'إذا كان لديك أي أسئلة أو مخاوف بشأن سياسة الخصوصية الخاصة بنا أو كيفية تعاملنا مع بياناتك، فلا تتردد في الاتصال بنا:',
      email: 'البريد الإلكتروني',
      address: 'العنوان',
      changesToPolicy: 'التغييرات على هذه السياسة',
      changesPolicyText: 'قد نقوم بتحديث سياسة الخصوصية الخاصة بنا من وقت لآخر. سنخطرك بأي تغييرات من خلال نشر سياسة الخصوصية الجديدة على هذه الصفحة وتحديث تاريخ "آخر تحديث". نشجعك على مراجعة سياسة الخصوصية هذه بشكل دوري للاطلاع على أي تغييرات.',
      
      // Terms of Service
      termsOfServiceTitle: 'شروط الخدمة',
      effectiveDate: 'تاريخ السريان',
      termsIntro: 'يرجى قراءة هذه الشروط بعناية قبل استخدام أكاديمية إيدوفلو',
      agreementToTerms: 'الموافقة على الشروط',
      agreementText: 'تحكم شروط الخدمة هذه استخدامك لأكاديمية إيدوفلو وتشكل اتفاقية ملزمة قانوناً بينك وبين أكاديمية إيدوفلو. من خلال الوصول إلى منصتنا أو استخدامها، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بهذه الشروط. إذا كنت لا توافق على هذه الشروط، فيجب عليك عدم الوصول إلى خدماتنا أو استخدامها.',
      
      acceptanceOfTerms: 'قبول الشروط',
      acceptanceContent: 'من خلال الوصول إلى أكاديمية إيدوفلو واستخدامها، فإنك تقبل وتوافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على هذه الشروط، فيرجى عدم استخدام منصتنا. نحتفظ بالحق في تعديل هذه الشروط في أي وقت، واستمرارك في الاستخدام يعني قبول أي تغييرات.',
      
      userAccounts: 'حسابات المستخدمين',
      userAccountsContent: 'أنت مسؤول عن الحفاظ على سرية بيانات اعتماد حسابك. يجب عليك تقديم معلومات دقيقة وكاملة أثناء التسجيل. أنت مسؤول عن جميع الأنشطة التي تحدث في حسابك. أخطرنا فوراً بأي استخدام غير مصرح به لحسابك.',
      
      courseAccess: 'الوصول إلى الدورات والمحتوى',
      courseAccessContent: 'عند التسجيل، تحصل على ترخيص غير حصري وغير قابل للتحويل للوصول إلى محتوى الدورة للاستخدام الشخصي فقط. محتوى الدورة محمي بحقوق النشر ولا يمكن إعادة توزيعه أو تسجيله أو مشاركته دون إذن صريح. نحتفظ بالحق في تعديل أو إزالة محتوى الدورة في أي وقت.',
      
      paymentsAndRefunds: 'المدفوعات والاستردادات',
      paymentsContent: 'يتم إدراج جميع أسعار الدورات بالعملة المحددة. يجب سداد الدفع بالكامل قبل الوصول إلى المحتوى المدفوع. نقدم ضماناً لاسترداد الأموال لمدة 30 يوماً للدورات المدفوعة. تتم معالجة المبالغ المستردة في غضون 7-10 أيام عمل. قد يخضع أهلية الاسترداد للمراجعة.',
      
      prohibitedActivities: 'السلوك المحظور',
      prohibitedContent: 'أنت توافق على عدم: مشاركة بيانات اعتماد الحساب، إعادة توزيع محتوى الدورة، مضايقة مستخدمين أو مدرسين آخرين، استخدام المنصة لأنشطة غير قانونية، محاولة اختراق أو تعريض أمان المنصة للخطر، تقديم معلومات كاذبة أو مضللة، أو الانخراط في أي نشاط يتعارض مع عمليات المنصة.',
      
      intellectualProperty: 'الملكية الفكرية',
      intellectualPropertyContent: 'جميع المحتويات في أكاديمية إيدوفلو، بما في ذلك الدورات ومقاطع الفيديو والنصوص والرسومات والشعارات والبرامج، هي ملك لأكاديمية إيدوفلو أو موردي المحتوى الخاصين بها ومحمية بموجب حقوق النشر والعلامات التجارية وقوانين الملكية الفكرية الأخرى. قد يؤدي الاستخدام غير المصرح به إلى اتخاذ إجراءات قانونية.',
      
      studentResponsibilities: 'مسؤوليات الطلاب',
      studentResp1: 'إكمال الدورات بالسرعة التي تناسبك خلال فترة الوصول',
      studentResp2: 'تقديم عمل أصلي للواجبات والمشاريع',
      studentResp3: 'احترام المدرسين والطلاب الآخرين',
      studentResp4: 'تقديم ملاحظات وتقييمات بناءة',
      studentResp5: 'الحفاظ على النزاهة الأكاديمية',
      
      instructorResponsibilities: 'مسؤوليات المدرسين',
      instructorResp1: 'تقديم أوصاف دقيقة للدورات والمتطلبات الأساسية',
      instructorResp2: 'تقديم محتوى تعليمي عالي الجودة',
      instructorResp3: 'الرد على أسئلة الطلاب في الوقت المناسب',
      instructorResp4: 'تقييم الواجبات بشكل عادل وتقديم الملاحظات',
      instructorResp5: 'الحفاظ على محتوى الدورة محدثاً',
      
      platformRights: 'حقوق المنصة',
      platformRight1: 'تعديل أو إيقاف الخدمات في أي وقت',
      platformRight2: 'تعليق أو إنهاء الحسابات للانتهاكات',
      platformRight3: 'مراقبة استخدام المنصة للجودة والأمان',
      platformRight4: 'تحديث الرسوم والأسعار مع إشعار',
      platformRight5: 'جمع البيانات واستخدامها حسب سياسة الخصوصية',
      
      limitationOfLiability: 'حدود المسؤولية',
      liabilityText1: 'يتم توفير أكاديمية إيدوفلو "كما هي" بدون ضمانات من أي نوع. نحن لا نضمن أن المنصة ستكون خالية من الأخطاء أو دون انقطاع. إلى أقصى حد يسمح به القانون، لن تكون أكاديمية إيدوفلو مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية، بما في ذلك فقدان الأرباح أو البيانات أو الخسائر غير الملموسة الأخرى.',
      liabilityText2: 'نحن لسنا مسؤولين عن المحتوى المقدم من قبل المدرسين أو نتائج تجربة التعلم الخاصة بك. إكمال الدورة لا يضمن التوظيف أو أي نتائج محددة.',
      
      disputeResolution: 'حل النزاعات',
      disputeText: 'سيتم حل أي نزاعات تنشأ عن هذه الشروط أو استخدامك لأكاديمية إيدوفلو من خلال التحكيم الملزم وفقاً لقواعد التحكيم الدولية. أنت توافق على التنازل عن أي حق في محاكمة أمام هيئة محلفين أو المشاركة في دعوى جماعية.',
      
      questionsAboutTerms: 'أسئلة حول الشروط؟',
      termsContactText: 'إذا كان لديك أي أسئلة حول شروط الخدمة هذه، يرجى الاتصال بنا:',
      disclaimers: 'إخلاء المسؤولية',
      governingLaw: 'القانون الحاكم',
      
      // Buttons & Actions
      browseAll: 'تصفح الكل',
      seeMore: 'شاهد المزيد',
      seeLess: 'شاهد أقل',
      loadMore: 'تحميل المزيد',
      showMore: 'عرض المزيد',
      showLess: 'عرض أقل',
      apply: 'تطبيق',
      reset: 'إعادة تعيين',
      filter: 'تصفية',
      sort: 'ترتيب',
      search: 'بحث',
      clear: 'مسح',
      confirm: 'تأكيد',
      close: 'إغلاق',
      back: 'رجوع',
      next: 'التالي',
      previous: 'السابق',
      finish: 'إنهاء',
      
      // Tour Guide
      takeATour: 'جولة إرشادية',
      tourBack: 'رجوع',
      tourNext: 'التالي',
      tourSkip: 'تخطي الجولة',
      tourFinish: 'إنهاء',
      tourClose: 'إغلاق',
      tourStep: 'خطوة',
      tourOf: 'من',
      tourStepOf: 'من',
      
      // Home Tour Steps
      homeTourWelcomeTitle: 'مرحباً بك في إيدوفلو! 🎓',
      homeTourWelcomeContent: 'رحلتك التعليمية تبدأ هنا. تصفح الدورات المميزة وابدأ التعلم اليوم. لنبدأ جولة سريعة!',
      homeTourNavTitle: 'شريط التنقل 🧭',
      homeTourNavContent: 'استخدم شريط التنقل للوصول إلى الصفحة الرئيسية والدورات والمدرسين ومعلومات عنا واتصل بنا.',
      homeTourCoursesTitle: 'تصفح الدورات 📚',
      homeTourCoursesContent: 'انقر هنا للتمرير واستكشاف جميع الدورات المتاحة عبر فئات ومستويات مختلفة.',
      homeTourInstructorsTitle: 'تعرف على مدرسينا 👨‍🏫',
      homeTourInstructorsContent: 'شاهد جميع المدرسين وخبراتهم.',
      homeTourAboutTitle: 'عنّا 📖',
      homeTourAboutContent: 'تعرف أكثر على أكاديمية إيدوفلو ومهمتنا في جعل التعليم متاحاً للجميع.',
      homeTourContactTitle: 'الاتصال والدعم 📞',
      homeTourContactContent: 'هل تحتاج مساعدة؟ اتصل بنا في أي وقت للحصول على الدعم والمساعدة.',
      homeTourUserActionsTitle: 'إجراءات المستخدم 🎯',
      homeTourUserActionsContent: 'الوصول إلى إعدادات السمة وخيارات اللغة والرسائل وملفك الشخصي من هنا.',
      homeTourHeroTitle: 'القسم الرئيسي 🌟',
      homeTourHeroContent: 'هذا هو المحتوى المميز الذي يعرض ما يجعل إيدوفلو مميزاً. اكتشف أفضل تجربة تعليمية!',
      homeTourFeaturedTitle: 'الدورات المميزة 📚',
      homeTourFeaturedContent: 'تصفح مجموعة دوراتنا. قم بالتصفية حسب الفئة أو المستوى أو ابحث عن مواضيع محددة.',
      
      // Course Details Tour Steps
      courseDetailsTourWelcomeTitle: 'صفحة تفاصيل الدورة 📚',
      courseDetailsTourWelcomeContent: 'تعلم كل شيء عن هذه الدورة قبل التسجيل. لنستكشف ما هو متاح!',
      courseDetailsTourInfoTitle: 'معلومات الدورة ℹ️',
      courseDetailsTourInfoContent: 'عرض عنوان الدورة والوصف والمستوى والفئة وتفاصيل المدرس هنا.',
      courseDetailsTourSectionsTitle: 'أقسام الدورة 📑',
      courseDetailsTourSectionsContent: 'كل دورة منظمة في أقسام. داخل كل قسم، ستجد: 📹 محاضرات (فيديوهات للمشاهدة)، 📝 واجبات (مهام لإكمالها وتقديمها)، 🛠️ مشاريع (أعمال عملية للتحميل)، و ✅ اختبارات نشطة (اختبارات للحل). قم بتوسيع أي قسم لرؤية محتواه!',
      courseDetailsTourCertificateTitle: 'شهادة الدورة 🎓',
      courseDetailsTourCertificateContent: 'عندما تكمل جميع متطلبات الدورة (المحاضرات المشاهدة، الواجبات المقدمة، المشاريع المكتملة، والاختبارات المحلولة)، يمكنك طلب شهادة إتمام الدورة من لوحة التحكم أو علامة تبويب الشهادات!',
      
      // Student Dashboard Tour Steps
      studentDashboardTourWelcomeTitle: 'مرحباً بك في لوحة التحكم! 🎯',
      studentDashboardTourWelcomeContent: 'هذا هو مركز التعلم الخاص بك. لنستكشف ما يمكنك القيام به هنا لتحقيق أقصى استفادة من التعلم!',
      studentDashboardTourCoursesTitle: 'دوراتي المسجلة 📖',
      studentDashboardTourCoursesContent: 'عرض جميع الدورات التي سجلت بها. انقر على أي دورة لمتابعة التعلم وتتبع تقدمك.',
      studentDashboardTourCardsTitle: 'بطاقات الدورات 🎴',
      studentDashboardTourCardsContent: 'كل بطاقة تعرض تفاصيل الدورة بما في ذلك التقدم والمدرس والمستوى. انقر للوصول إلى محتوى الدورة.',
      studentDashboardTourPaymentTitle: 'سجل الدفع 💳',
      studentDashboardTourPaymentContent: 'عرض جميع مدفوعات دوراتك والإيصالات. تتبع سجل الدفع وتنزيل الفواتير.',
      studentDashboardTourDiscoverTitle: 'اكتشف دورات جديدة 🔍',
      studentDashboardTourDiscoverContent: 'استكشف وسجل في دورات جديدة لتوسيع معرفتك. قم بالتصفية حسب الفئة أو المستوى.',
      studentDashboardTourBrowseTitle: 'تصفح جميع الدورات 🌐',
      studentDashboardTourBrowseContent: 'انقر هنا لرؤية جميع الدورات المتاحة والعثور على مغامرة التعلم القادمة!',
      studentDashboardTourMessagesTitle: 'الرسائل والدعم 💬',
      studentDashboardTourMessagesContent: 'تواصل مع المدرسين، احصل على الدعم، واستقبل إشعارات مهمة حول دوراتك.',
      
      // Dashboard Stats
      totalStudents: 'إجمالي الطلاب',
      totalCourses: 'إجمالي الدورات',
      totalInstructors: 'إجمالي المدربين',
      activeEnrollments: 'التسجيلات النشطة',
      courseProgress: 'تقدم الدورة',
      overallGrade: 'الدرجة الإجمالية',
      completionRate: 'معدل الإنجاز',
      upcomingDeadlines: 'المواعيد النهائية القادمة',
      recentActivity: 'النشاط الأخير',
      
      // Course Management
      addSection: 'إضافة قسم',
      addContent: 'إضافة محتوى',
      editCourse: 'تعديل الدورة',
      deleteCourse: 'حذف الدورة',
      publishCourse: 'نشر الدورة',
      unpublishCourse: 'إلغاء نشر الدورة',
      courseStructure: 'هيكل الدورة',
      sections: 'الأقسام',
      content: 'المحتوى',
      students: 'الطلاب',
      
      // User Management
      addUser: 'إضافة مستخدم',
      editUser: 'تعديل المستخدم',
      deleteUser: 'حذف المستخدم',
      activateUser: 'تفعيل المستخدم',
      deactivateUser: 'تعطيل المستخدم',
      userDetails: 'تفاصيل المستخدم',
      userList: 'قائمة المستخدمين',
      
      // Contact
      contactUs: 'اتصل بنا',
      getInTouch: 'تواصل معنا',
      sendUs: 'أرسل لنا رسالة',
      yourName: 'اسمك',
      yourEmail: 'بريدك الإلكتروني',
      yourMessage: 'رسالتك',
      
      // Footer specific
      company: 'الشركة',
      learning: 'التعلم',
      eduflowAcademy: 'أكاديمية إيدوفلو',
      eduflowTagline: 'نمكّن المتعلمين في جميع أنحاء العالم بتعليم برمجة ولغات عالي الجودة.',
      joinThousands: 'انضم إلى آلاف الطلاب الذين حولوا مسيرتهم المهنية مع دوراتنا التي يقدمها خبراء.',
      onlineLearningPlatform: 'منصة التعلم عبر الإنترنت',
      availableViaMessage: 'متاح عبر الرسائل',
      enterSubject: 'أدخل الموضوع...',
      enterYourMessage: 'أدخل رسالتك...',
      sending: 'جاري الإرسال...',
      
      // Instructors page
      meetOurInstructors: 'تعرف على مدربينا',
      expertInstructorsTeam: 'تعلم من محترفين رائدين في الصناعة',
      instructorsList: 'المدربون',
      rating: 'التقييم',
      expertise: 'الخبرة',
      
      // Profile & Settings
      myProfile: 'ملفي الشخصي',
      editProfile: 'تعديل الملف الشخصي',
      personalInformation: 'المعلومات الشخصية',
      fullName: 'الاسم الكامل',
      emailAddress: 'عنوان البريد الإلكتروني',
      phoneNumber: 'رقم الهاتف',
      bio: 'نبذة تعريفية',
      updateProfile: 'تحديث الملف الشخصي',
      profileUpdated: 'تم تحديث الملف الشخصي بنجاح',
      
      // Settings
      generalSettings: 'الإعدادات العامة',
      notificationSettings: 'إعدادات الإشعارات',
      privacySettings: 'إعدادات الخصوصية',
      emailNotifications: 'إشعارات البريد الإلكتروني',
      pushNotifications: 'الإشعارات الفورية',
      language: 'اللغة',
      theme: 'المظهر',
      darkMode: 'الوضع الداكن',
      lightMode: 'الوضع الفاتح',
      studentSettings: 'إعدادات الطالب',
      manageProfileAndPreferences: 'إدارة ملفك الشخصي وتفضيلاتك',
      profileInformation: 'معلومات الملف الشخصي',
      profilePicture: 'صورة الملف الشخصي',
      avatarPreview: 'معاينة الصورة',
      chooseImage: 'اختر صورة',
      imageRequirements: 'JPG، PNG، GIF أو WEBP. الحد الأقصى للحجم: 5 ميجابايت',
      nameCanOnlyBeChanged: 'الاسم يمكن تغييره فقط في قسم الملف الشخصي',
      phoneCanOnlyBeChanged: 'الهاتف يمكن تغييره فقط في قسم الملف الشخصي',
      jobRole: 'المسمى الوظيفي',
      jobRolePlaceholder: 'مثال: مطور برمجيات، طالب، مصمم',
      shortBio: 'نبذة مختصرة',
      bioBriefIntro: 'مقدمة مختصرة...',
      aboutMeDetailed: 'نبذة تفصيلية عني',
      shareMoreAboutYourself: 'شارك المزيد عن نفسك ورحلتك التعليمية وأهدافك',
      saveSettings: 'حفظ الإعدادات',
      dangerZone: 'منطقة الخطر',
      irreversibleActions: 'إجراءات لا رجعة فيها ومدمرة',
      deleteAccount: 'حذف الحساب',
      permanentlyDeleteAccount: 'حذف حسابك وجميع البيانات المرتبطة به بشكل دائم. هذا الإجراء لا يمكن التراجع عنه.',
      deleteMyAccount: 'حذف حسابي',
      deleteAccountConfirmTitle: 'حذف الحساب',
      thisActionPermanent: 'هذا الإجراء دائم ولا يمكن التراجع عنه. ستتم إزالة جميع بياناتك بما في ذلك:',
      profileInfo: 'معلومات الملف الشخصي',
      courseEnrollments: 'تسجيلات الدورات',
      certificatesData: 'الشهادات',
      progressAndGrades: 'التقدم والدرجات',
      messagesAndNotifications: 'الرسائل والإشعارات',
      willBePermanentlyDeleted: 'سيتم حذفها نهائياً من خوادمنا.',
      typeToConfirm: 'اكتب',
      deleteMyAccountCaps: 'DELETE MY ACCOUNT',
      toConfirm: 'للتأكيد',
      deleting: 'جاري الحذف...',
      pleaseTypeToConfirm: 'يرجى كتابة "DELETE MY ACCOUNT" للتأكيد',
      failedToLoadProfile: 'فشل تحميل الملف الشخصي',
      imageMustBeLess5MB: 'يجب أن تكون الصورة أقل من 5 ميجابايت',
      pleaseSelectImage: 'يرجى تحديد ملف صورة',
      saving: 'جاري الحفظ...',
      learner: 'متعلم',
      charactersCount: 'حرف',
      
      // Homepage
      discoverBestCourses: 'اكتشف أفضل الدورات عبر الإنترنت',
      transformCareer: 'حوّل مسيرتك المهنية مع دورات يقودها خبراء',
      exploreNow: 'استكشف الآن',
      viewDetails: 'عرض التفاصيل',
      enrolledStudents: 'الطلاب المسجلين',
      viewAll: 'عرض الكل',
      seeAllCourses: 'مشاهدة جميع الدورات',
      recentCourses: 'الدورات الحديثة',
      discoverMostPopularCourses: 'اكتشف دوراتنا الأكثر شعبية',
      noCoursesFound: 'لم يتم العثور على دورات',
      tryDifferentFilters: 'جرب تعديل بحثك أو المرشحات',
      noCoursesAvailable: 'لا توجد دورات متاحة بعد',
      showMore: 'عرض المزيد',
      
      // Messages specific
      compose: 'إنشاء',
      reply: 'رد',
      forward: 'إعادة توجيه',
      markAsRead: 'وضع علامة كمقروءة',
      markAsUnread: 'وضع علامة كغير مقروءة',
      deleteMessage: 'حذف الرسالة',
      
      // Status
      active: 'نشط',
      inactive: 'غير نشط',
      published: 'منشور',
      draft: 'مسودة',
      approved: 'موافق عليه',
      rejected: 'مرفوض',
      
      // Time & Date
      today: 'اليوم',
      yesterday: 'أمس',
      lastWeek: 'الأسبوع الماضي',
      lastMonth: 'الشهر الماضي',
      thisYear: 'هذا العام',
      
      // Homepage Animations
      learnFromExperts: 'تعلم من الخبراء',
      masterNewSkillsWithIndustryLeading: 'أتقن مهارات جديدة مع مدربين رائدين في الصناعة',
      advanceYourCareer: 'طور مسيرتك المهنية',
      gainInDemandSkillsAndCertificates: 'اكتسب المهارات المطلوبة واحصل على شهادات معترف بها',
      
      // Payment Methods
      paymentMethodsTitle: 'طرق الدفع',
      choosePreferredPaymentMethod: 'اختر طريقة الدفع المفضلة لديك واتبع التعليمات',
      fouad: 'فؤاد',
      haram: 'هرم',
      shamCash: 'شام كاش',
      westernUnion: 'ويسترن يونيون',
      
      // Stats
      studentsCount: 'الطلاب',
      coursesCount: 'الدورات',
      instructorsCount: 'المدربون',
      successRate: 'معدل النجاح',
      
      // Search & Discovery
      searchCoursesPlaceholder: 'البحث في الدورات...',
      discoverMostPopularCourses: 'اكتشف أكثر دوراتنا شعبية',
      experienceBestOnlineEducation: 'اختبر الأفضل في التعليم عبر الإنترنت',
      whyChooseEduFlowAcademy: 'لماذا تختار أكاديمية إيدوفلو؟',
      
      // Feature Cards
      certifiedLearning: 'تعلم معتمد',
      certifiedLearningDesc: 'احصل على شهادات معترف بها عند إتمام الدورة',
      expertInstructorsCard: 'مدربون خبراء',
      expertInstructorsCardDesc: 'تعلم من محترفين في الصناعة',
      flexibleSchedule: 'جدول مرن',
      flexibleScheduleDesc: 'ادرس بوتيرتك الخاصة، في أي وقت، في أي مكان',
      communitySupport: 'دعم المجتمع',
      communitySupportDesc: 'تواصل مع زملائك المتعلمين والمدربين',
      
      // Success Stories
      realSuccessStories: 'قصص نجاح حقيقية من مجتمع التعلم لدينا',
      whatOurStudentsSay: 'ماذا يقول طلابنا',
      testimonialDescription: 'آراء حقيقية من طلاب أنهوا دوراتنا وحققوا أهدافهم التعليمية.',
      
      // CTA
      readyToStartLearningJourney: 'هل أنت مستعد لبدء رحلة التعلم؟',
      joinThousandsOfStudents: 'انضم إلى آلاف الطلاب الذين يتعلمون معنا بالفعل',
      browseCourses: 'تصفح الدورات',
      getStartedFree: 'ابدأ مجاناً',
      exploreCourses: 'استكشف الدورات',
      viewCourses: 'عرض الدورات',
      startLearningToday: 'ابدأ التعلم اليوم',
      
      // Instructors
      instructors: 'المدرسون',
      viewProfile: 'عرض الملف الشخصي',
      coursesBy: 'دورات',
      noCoursesAvailableYet: 'لا توجد دورات متاحة بعد',
      backToInstructors: 'العودة إلى المدرسين',
      eduflow: 'إيدوفلو',
      
      // Student Dashboard
      continueYourLearningJourney: 'تابع رحلة التعلم الخاصة بك واكتشف دورات جديدة',
      enrolledCoursesCard: 'الدورات المسجلة',
      completedCoursesCard: 'الدورات المكتملة',
      inProgress: 'قيد التقدم',
      totalProgress: 'التقدم الإجمالي',
      
      // Course Details
      backToDashboard: 'العودة إلى لوحة التحكم',
      group: 'المجموعة',
      joinDiscussionGroup: 'انضم إلى مجموعة النقاش',
      courseSections: 'أقسام الدورة',
      lecturesCount: 'محاضرات',
      assignmentsCount: 'واجبات',
      projectsCount: 'مشاريع',
      lecture: 'محاضرة',
      assignment: 'واجب',
      project: 'مشروع',
      projectTutorial: 'فيديو تعليمي للمشروع',
      watchTutorialToUnderstand: 'شاهد الفيديو التعليمي لفهم متطلبات المشروع',
      watchTutorial: 'مشاهدة الفيديو',
      downloadStarterFiles: 'تحميل الملفات الأولية',
      
      // Profile Settings
      updatePassword: 'تحديث كلمة المرور',
      themePreference: 'المظهر',
      choosePreferredTheme: 'اختر المظهر المفضل لديك',
      switchToLightMode: 'التبديل إلى الوضع الفاتح',
      switchToDarkMode: 'التبديل إلى الوضع الداكن',
      languagePreference: 'اللغة',
      choosePreferredLanguage: 'اختر اللغة المفضلة لديك',
      switchToEnglish: 'التبديل إلى الإنجليزية',
      switchToArabic: 'التبديل إلى العربية',
      pendingActionsAnimationsLabel: 'تحريك إجراءات الانتظار',
      pendingActionsAnimationsDescription: 'تفعيل حركات بسيطة على شريط إجراءات الانتظار في لوحات التحكم.',
      pendingActionsAnimationsEnable: 'تفعيل',
      pendingActionsAnimationsDisable: 'إيقاف',
      manageAccountSettingsAndPreferences: 'إدارة إعدادات الحساب والتفضيلات',
      profileInformation: 'معلومات الملف الشخصي',
      emailCannotBeChanged: 'لا يمكن تغيير البريد الإلكتروني',
      
      // Student Settings
      studentSettings: 'إعدادات الطالب',
      manageProfileAndPreferences: 'إدارة ملفك الشخصي وتفضيلاتك',
      profilePicture: 'صورة الملف الشخصي',
      avatarPreview: 'معاينة الصورة الرمزية',
      chooseImage: 'اختر صورة',
      imageRequirements: 'JPG، PNG، GIF أو WEBP. الحجم الأقصى: 5 ميجابايت',
      jobRole: 'الوظيفة',
      learner: 'متعلم',
      shortBio: 'نبذة مختصرة',
      briefIntroduction: 'مقدمة موجزة...',
      charactersCount: 'حرف',
      aboutMeDetailed: 'نبذة مفصلة عني',
      shareMoreAboutYourself: 'شارك المزيد عن نفسك ورحلة التعلم وأهدافك',
      saveSettings: 'حفظ الإعدادات',
      dangerZone: 'منطقة الخطر',
      irreversibleActions: 'إجراءات لا رجعة فيها ومدمرة',
      deleteAccount: 'حذف الحساب',
      permanentlyDeleteAccount: 'حذف حسابك وجميع البيانات المرتبطة به بشكل دائم. هذا الإجراء لا يمكن التراجع عنه.',
      deleteMyAccount: 'حذف حسابي',
      
      // Certificates
      myCertificates: 'شهاداتي',
      viewAndRequestCertificates: 'عرض وطلب الشهادات للدورات المكتملة',
      issuedCertificates: 'الشهادات الصادرة',
      gradeLabel: 'الدرجة:',
      grade: 'الدرجة',
      issued: 'تم الإصدار',
      view: 'عرض',
      download: 'تحميل',
      rateThisCourse: 'قيم هذه الدورة',
      issuedOn: 'تاريخ الإصدار',
      group: 'المجموعة',
      requestCertificate: 'طلب الشهادة',
      noCertificatesYet: 'لا توجد شهادات بعد',
      completeCoursesWith70: 'أكمل الدورات بدرجة 70% أو أعلى لطلب الشهادات',
      noEligibleCourses: 'لا توجد دورات مؤهلة',
      keepLearningToEarnCertificates: 'استمر في التعلم وأكمل الدورات بدرجة 70% أو أعلى للحصول على الشهادات',
      requestPending: 'طلب معلق',
      requestDenied: 'طلب مرفوض',
      request: 'طلب',
      requested: 'تم الطلب',
      rateCourse: 'قيم الدورة',
      yourRating: 'تقييمك',
      yourReview: 'مراجعتك (اختياري)',
      writeYourReview: 'اكتب مراجعتك هنا...',
      submitRating: 'إرسال التقييم',
      cancel: 'إلغاء',
      delivered: 'تم التسليم',
      pending: 'قيد الانتظار',
      requestAgain: 'طلب مرة أخرى',
      previousRejectionReason: 'سبب الرفض السابق',
      course: 'الدورة',
      feedbackHelpsOthers: 'ملاحظاتك تساعد الطلاب الآخرين على اتخاذ قرارات مستنيرة!',
      rating: 'التقييم',
      star: 'نجمة',
      stars: 'نجوم',
      shareYourExperience: 'شارك تجربتك مع هذه الدورة...',
      characters: 'حرف',
      skipForNow: 'تخطى الآن',
      
      // Help Center
      helpCenterTitle: 'مركز المساعدة',
      howCanWeHelpYou: 'كيف يمكننا مساعدتك؟',
      searchForAnswers: 'ابحث عن الإجابات أو تصفح المقالات حسب الفئة',
      searchHelp: 'البحث في مقالات المساعدة...',
      browseCategories: 'تصفح الفئات',
      popularArticles: 'المقالات الشائعة',
      all: 'الكل',
      gettingStarted: 'البدء',
      coursesAndLearning: 'الدورات والتعلم',
      coursesLearning: 'الدورات والتعلم',
      instructors: 'المدرسون',
      paymentsAndBilling: 'المدفوعات والفواتير',
      paymentsBilling: 'المدفوعات والفواتير',
      accountManagement: 'إدارة الحساب',
      troubleshooting: 'استكشاف الأخطاء وإصلاحها',
      allCategories: 'جميع الفئات',
      
      // Help Articles - Getting Started (Arabic)
      helpQ1: 'كيفية إنشاء حساب',
      helpA1: `إنشاء حساب على إيدوفلو بسيط:
    
1. انقر على زر "إنشاء حساب" في شريط التنقل العلوي
2. اختر دورك: طالب أو مدرس
3. املأ بياناتك (الاسم، البريد الإلكتروني، كلمة المرور)
4. تحقق من عنوان بريدك الإلكتروني بالنقر على الرابط المرسل إلى صندوق الوارد
5. أكمل ملفك الشخصي بمعلومات إضافية

يمكن للطلاب البدء في التسجيل في الدورات فوراً بعد التسجيل. يحتاج المدرسون إلى انتظار موافقة المسؤول قبل إنشاء الدورات.`,
      
      helpQ2: 'التسجيل في الدورات',
      helpA2: `للتسجيل في دورة:

1. تصفح الدورات المتاحة من الصفحة الرئيسية أو صفحة الدورات
2. انقر على دورة لعرض تفاصيلها
3. تحقق من أقسام الدورة - قد يكون بعضها مجانياً والبعض الآخر مدفوعاً
4. انقر على "تسجيل" للأقسام المجانية أو "الدفع والتسجيل" للأقسام المدفوعة
5. بالنسبة للأقسام المدفوعة، قم بتحميل إيصال الدفع (دليل التحويل البنكي)
6. انتظر موافقة المدرس على دفعتك
7. بمجرد الموافقة، يمكنك الوصول إلى جميع محتويات الدورة

يمكنك التسجيل في عدة دورات وتتبع تقدمك من لوحة التحكم الخاصة بك.`,
      
      helpQ3: 'دليل التنقل في المنصة',
      helpA3: `دليل التنقل في المنصة:

**شريط التنقل الرئيسي:**
- الرئيسية: العودة إلى الصفحة الرئيسية
- الدورات: تصفح جميع الدورات المتاحة
- المدرسون: عرض جميع المدرسين
- حول: تعرف على إيدوفلو
- اتصل: تواصل مع المسؤول

**لوحة تحكم المستخدم (بعد تسجيل الدخول):**
- الطلاب: عرض الدورات المسجلة، تتبع التقدم، تقديم الواجبات
- المدرسون: إدارة الدورات والأقسام والمحتوى، تقييم الواجبات
- المسؤول: إدارة المستخدمين، التحقق من المدفوعات، الإشراف على المنصة

**قائمة الملف الشخصي (أعلى اليمين):**
- لوحة التحكم: الانتقال إلى لوحة التحكم الرئيسية
- الملف الشخصي: عرض الملف الشخصي العام
- الإعدادات: تحديث معلومات الملف الشخصي والصورة
- تسجيل الخروج: الخروج من حسابك`,
      
      platformNavigation: 'دليل التنقل في المنصة',
      profileManagement: 'إدارة الملف الشخصي',
      accessCourseContent: 'الوصول لمحتوى الدورة',
      progressTracking: 'تتبع التقدم',
      assignmentSubmission: 'عملية تسليم الواجبات',
      downloadMaterials: 'تحميل مواد الدورة',
      becomeInstructor: 'كن مدرساً في إيدوفلو',
      createCourse: 'إنشاء دورة جديدة',
      studentManagement: 'إدارة الطلاب',
      assignmentGrading: 'تقييم الواجبات',
      paymentMethods: 'طرق الدفع',
      refundPolicy: 'سياسة الاسترجاع',
      receiptVerification: 'التحقق من الإيصالات',
      paymentIssues: 'مشاكل الدفع الشائعة',
      stillNeedHelp: 'لا تزال بحاجة إلى مساعدة؟',
      emailSupport: 'الدعم عبر البريد الإلكتروني',
      
      helpQ4: 'إدارة ملفك الشخصي',
      helpA4: `إدارة الملف الشخصي:

1. انقر على صورتك/اسمك في الزاوية العلوية اليمنى
2. اختر "الإعدادات" من القائمة المنسدلة
3. حدّث معلوماتك:
   - صورة الملف الشخصي: تحميل صورة (بحد أقصى 5 ميجابايت)
   - الاسم والبريد الإلكتروني
   - رقم الهاتف
   - نبذة مختصرة (500 حرف)
   - نبذة تفصيلية (مع تنسيق النص الغني)
   - المسمى الوظيفي (للطلاب)
   - الخبرة والروابط الاجتماعية (للمدرسين)
4. انقر على "حفظ الإعدادات"

ستظهر صورتك في جميع أنحاء المنصة. تأكد من استخدام صورة واضحة واحترافية!`,
      
      // Help Articles - Courses & Learning (5-8) Arabic
      helpQ5: 'الوصول إلى محتوى الدورة',
      helpA5: `الوصول إلى محتوى الدورة:

1. انتقل إلى لوحة تحكم الطالب
2. انقر على أي دورة مسجل بها
3. عرض هيكل الدورة: المجموعات ← الأقسام ← المحتوى
4. انقر على قسم لعرض محتواه
5. تتضمن أنواع المحتوى:
   - محاضرات الفيديو: شاهد وتتبع التقدم
   - الواجبات: تنزيل وإكمال وتقديم
   - المشاريع: ملفات بداية وتقديم

**متطلبات الوصول:**
- الأقسام المجانية: متاحة فوراً بعد التسجيل
- الأقسام المدفوعة: متاحة بعد التحقق من الدفع
- المتطلبات الأساسية: أكمل الأقسام السابقة أولاً (إذا لزم الأمر)`,
      
      helpQ6: 'تتبع تقدمك',
      helpA6: `تتبع التقدم:

يتم تتبع تقدمك تلقائياً:

**الفيديوهات:**
- يتم تحديث التقدم أثناء المشاهدة
- تُعلّم كـ "تمت المشاهدة" (100٪) عند الإكمال
- يمكن المراجعة في أي وقت

**الواجبات/المشاريع:**
- تظهر "في انتظار التحميل" قبل التقديم
- تظهر "قيد المراجعة (50٪)" بعد التقديم
- تظهر الدرجة النهائية (0-100٪) بعد تقييم المدرس

**التقدم الإجمالي:**
- عرض نسبة إكمال القسم
- تتبع التقدم على مستوى الدورة
- رؤية الدرجات لجميع التقييمات

يتم حفظ التقدم في الوقت الفعلي ومزامنته عبر الأجهزة.`,
      
      helpQ7: 'تقديم الواجبات',
      helpA7: `عملية تقديم الواجب:

1. شاهد جميع مقاطع الفيديو التعليمية في القسم
2. قم بتنزيل ملف الواجب (عادةً بتنسيق .rar)
3. أكمل الواجب وفقاً للتعليمات
4. اضغط عملك في ملف .rar
5. انقر على "اختر ملف" وحدد ملف .rar الخاص بك
6. قدم الواجب
7. احصل على درجة أولية 50٪ (قيد المراجعة)
8. انتظر تقييم المدرس
9. اعرض الدرجة النهائية والملاحظات

**مهم:**
- يتم قبول ملفات .rar فقط
- حد حجم الملف: 500 ميجابايت
- قدم قبل الموعد النهائي لتجنب العقوبات
- يمكنك إعادة التقديم إذا سمح المدرس`,
      
      helpQ8: 'تنزيل المواد',
      helpA8: `تنزيل مواد الدورة:

**لتنزيل المواد:**
1. انتقل إلى محتوى القسم
2. ابحث عن زر "تنزيل" بجوار الواجبات/المشاريع
3. انقر لتنزيل ملفات البداية أو الموارد أو القوالب
4. المواد عادةً بتنسيق .rar أو .zip

**التنزيلات المتاحة:**
- قوالب الواجبات والتعليمات
- كود بداية المشروع
- موارد تكميلية
- مواد مرجعية

**استكشاف الأخطاء:**
- إذا فشل التنزيل، قم بالتحديث وحاول مرة أخرى
- تأكد من استقرار اتصال الإنترنت
- اتصل بالمدرس إذا كان الملف غير متاح`,
      
      // Help Articles - Instructors (9-12) Arabic
      helpQ9: 'أن تصبح مدرساً',
      helpA9: `كن مدرساً في إيدوفلو:

**عملية التقديم:**
1. سجّل بدور "مدرس"
2. أكمل ملفك الشخصي بـ:
   - صورة احترافية
   - سيرة ذاتية مفصلة وخبرة
   - روابط اجتماعية (LinkedIn، GitHub، إلخ)
3. انتظر موافقة المسؤول (عادةً 24-48 ساعة)
4. استلم إشعار بريد إلكتروني عند الموافقة

**المتطلبات:**
- خبرة في مجال التدريس الخاص بك
- ملف شخصي احترافي
- التزام بالتعليم عالي الجودة
- الاستجابة لاستفسارات الطلاب

**بعد الموافقة:**
- إنشاء دورات غير محدودة
- تحديد أسعارك الخاصة
- إدارة الطلاب والمحتوى
- الربح من الأقسام المدفوعة`,
      
      helpQ10: 'إنشاء الدورات',
      helpA10: `إنشاء دورة جديدة:

1. انتقل إلى لوحة تحكم المدرس
2. انقر على "إنشاء دورة جديدة"
3. املأ تفاصيل الدورة:
   - الاسم والوصف
   - المستوى (مبتدئ، متوسط، متقدم)
   - المدة والفئة
   - صورة مصغرة للدورة (اختياري)
4. احفظ الدورة
5. أنشئ مجموعات (دفعات الدورة)
6. أضف أقساماً إلى المجموعات
7. حمّل المحتوى (فيديوهات، واجبات، مشاريع)
8. حدد التسعير لكل قسم
9. انشر عندما تكون جاهزاً

**أفضل الممارسات:**
- أهداف دورة واضحة
- محتوى منظم جيداً
- محاضرات فيديو جذابة
- واجبات عملية
- دعم الطلاب في الوقت المناسب`,
      
      helpQ11: 'إدارة الطلاب',
      helpA11: `إدارة الطلاب:

**عرض الطلاب المسجلين:**
1. انتقل إلى تفاصيل الدورة
2. عرض الطلاب لكل مجموعة
3. تتبع حالة التسجيل

**مراقبة التقدم:**
- عرض معدلات إكمال الطلاب
- التحقق من تقديمات الواجبات
- تتبع الدرجات والأداء

**التواصل:**
- إرسال رسائل للطلاب مباشرة
- الرد على الاستفسارات
- تقديم ملاحظات على الواجبات

**التحقق من الدفع:**
- مراجعة إيصالات الدفع
- الموافقة أو رفض المدفوعات
- يحصل الطلاب على الوصول بعد الموافقة`,
      
      helpQ12: 'تقييم الواجبات',
      helpA12: `عملية تقييم الواجبات:

1. انتقل إلى علامة تبويب "تقييم الواجبات" في لوحة التحكم
2. عرض التقديمات المعلقة
3. قم بتنزيل ملف .rar الخاص بالطالب
4. راجع العمل
5. أدخل الدرجة (0-100٪)
6. أضف تعليقات الملاحظات
7. قدم الدرجة
8. يتلقى الطالب إشعاراً

**إرشادات التقييم:**
- كن عادلاً ومتسقاً
- قدم ملاحظات بناءة
- قيّم في إطار زمني معقول
- ضع في الاعتبار الجهد والفهم
- استخدم معايير التقييم للموضوعية

**الدرجة الأولية 50٪:**
يحصل الطلاب تلقائياً على 50٪ عند التقديم كدرجة "قيد المراجعة". درجتك النهائية تحل محل هذه.`,
      
      // Help Articles - Payments & Billing (13-16) Arabic
      helpQ13: 'طرق الدفع',
      helpA13: `طرق الدفع:

**نظام الدفع الحالي:**
تستخدم إيدوفلو نظام الدفع عبر التحويل البنكي:

1. عرض سعر القسم
2. انقر على "الدفع والتسجيل"
3. سترى تفاصيل التحويل البنكي
4. قم بالدفع إلى الحساب المحدد
5. التقط لقطة شاشة/صورة للإيصال
6. حمّل الإيصال (JPG، PNG، أو PDF - بحد أقصى 10 ميجابايت)
7. قدم للتحقق
8. انتظر موافقة المدرس
9. الوصول إلى المحتوى بمجرد الموافقة

**تنسيقات الإيصال المدعومة:**
- صورة: JPG، JPEG، PNG
- مستند: PDF

**وقت المعالجة:**
عادةً 24-48 ساعة للموافقة.`,
      
      helpQ14: 'سياسة الاسترداد',
      helpA14: `سياسة الاسترداد:

**ضمان استرداد الأموال لمدة 30 يوماً:**
- طلب الاسترداد خلال 30 يوماً من الدفع
- ينطبق على جميع الأقسام المدفوعة
- بدون أسئلة

**عملية الاسترداد:**
1. اتصل بالمدرس أو المسؤول
2. قدم إيصال الدفع والسبب
3. تتم معالجة الاسترداد في غضون 5-7 أيام عمل
4. إرجاع الأموال إلى طريقة الدفع الأصلية

**الشروط:**
- يجب الطلب خلال 30 يوماً
- مطلوب إيصال أصلي
- قد يتم تعليق الحساب في حالة إساءة الاستخدام
- لا استرداد بعد الإكمال

**الاتصال:** أرسل رسالة عبر المنصة أو بريد إلكتروني للدعم.`,
      
      helpQ15: 'التحقق من الإيصال',
      helpA15: `عملية التحقق من الإيصال:

**للطلاب:**
1. حمّل إيصالاً واضحاً بعد الدفع
2. انتظر مراجعة المدرس/المسؤول
3. استلم إشعار بريد إلكتروني بالحالة
4. يُمنح الوصول عند الموافقة

**معايير التحقق:**
- يظهر الإيصال المبلغ الصحيح
- تاريخ المعاملة حديث
- تفاصيل الحساب متطابقة
- الإيصال واضح وأصلي

**إذا تم الرفض:**
- أعد تحميل إيصال أوضح
- اتصل بالمدرس للتوضيح
- تحقق من تطابق مبلغ الدفع مع السعر

**وقت المعالجة:**
- أيام الأسبوع: 24-48 ساعة
- عطلات نهاية الأسبوع: قد تستغرق وقتاً أطول
- عاجل: راسل المدرس مباشرة`,
      
      helpQ16: 'مشاكل الدفع',
      helpA16: `مشاكل الدفع الشائعة والحلول:

**فشل تحميل الإيصال:**
- تحقق من حجم الملف (بحد أقصى 10 ميجابايت)
- استخدم تنسيقاً مدعوماً (JPG، PNG، PDF)
- تأكد من استقرار اتصال الإنترنت

**لم تتم الموافقة على الدفع:**
- تحقق من دفع المبلغ الصحيح
- تحقق من أن الإيصال واضح وكامل
- اتصل بالمدرس للتوضيح
- أعد التحميل إذا كانت المحاولة الأولى غير واضحة

**تم دفع مبلغ خاطئ:**
- اتصل بالمدرس فوراً
- قدم إثبات الدفع
- يمكن للمدرس التعديل أو طلب الفرق

**الدفع عالق في الانتظار:**
- انتظر 48 ساعة للمراجعة
- راسل المدرس إذا كان عاجلاً
- تحقق من الإشعارات للتحديثات

**اتصل بالدعم:**
استخدم زر "تواصل معنا" في التذييل لإرسال رسالة للمسؤول مباشرة.`,
      
      // Static Pages
      privacyPolicyTitle: 'سياسة الخصوصية',
      termsOfServiceTitle: 'شروط الخدمة',
      aboutUsTitle: 'عنّا',
      faqTitle: 'الأسئلة المتكررة',
      
      // Course Details Page (Public) - Arabic
      courseNotFound: 'الدورة غير موجودة',
      backToHome: 'العودة للصفحة الرئيسية',
      groups: 'مجموعات',
      whatYoullLearn: "ما سوف تتعلمه",
      courseCoversKeyTopics: 'تغطي هذه الدورة الموضوعات الرئيسية لتحقيق المستوى المذكور. تشمل المحاضرات والواجبات والمشاريع.',
      continueCourse: 'متابعة الدورة',
      enrollmentPendingApproval: 'التسجيل في انتظار الموافقة',
      selectGroup: 'اختر المجموعة',
      chooseAGroup: 'اختر مجموعة',
      continueToEnrollment: 'المتابعة للتسجيل',
      loginAsStudentToEnroll: 'سجل الدخول كطالب للتسجيل',
      createAccountOrLogin: 'أنشئ حساباً أو سجل الدخول للتسجيل',
      studentReviews: 'تقييمات الطلاب',
      noReviewsYet: 'لا توجد تقييمات بعد. كن أول من يقيم هذه الدورة!',
      completeEnrollment: 'إتمام التسجيل',
      paymentRequired: 'الدفع مطلوب',
      groupRequiresPayment: 'تتطلب هذه المجموعة',
      monthly: 'شهري',
      perSection: 'لكل قسم',
      paymentOf: 'دفع قدره',
      paymentMethod: 'طريقة الدفع',
      selectPaymentMethod: 'اختر طريقة الدفع',
      haramHawala: 'حوالة هرم',
      fouadHawala: 'حوالة فؤاد',
      shamCash: 'شام كاش',
      westernUnion: 'ويسترن يونيون',
      paymentReceiptUrl: 'رابط إيصال الدفع',
      uploadReceiptInstruction: 'قم بتحميل صورة الإيصال والصق الرابط هنا، أو أرسله عبر الرسائل للمسؤول/المدرس للتحقق.',
      canAlsoUploadViaMessages: 'يمكنك أيضاً تحميل الإيصال عبر صفحة',
      messagesPage: 'الرسائل',
      pageToInstructorOrAdmin: 'إلى المدرس أو المسؤول.',
      freeGroupEnrollImmediately: 'هذه مجموعة مجانية. يمكنك التسجيل فوراً.',
      confirmEnrollment: 'تأكيد التسجيل',
      enrolling: 'جارٍ التسجيل...',
      anonymous: 'مجهول',
      
      // Student Course Details Page - Arabic
      overallGrade: 'الدرجة الإجمالية',
      unlockAllSections: 'فتح جميع الأقسام',
      payForAllLockedSections: 'ادفع مقابل جميع',
      lockedSection: 'قسم مقفل',
      lockedSections: 'أقسام مقفلة',
      atOnce: 'دفعة واحدة',
      pay: 'ادفع',
      noContentAvailable: 'لا يوجد محتوى متاح',
      lecturesUppercase: 'المحاضرات',
      assignmentsUppercase: 'الواجبات',
      projectsUppercase: 'المشاريع',
      selectContentFromLeft: 'اختر محتوى من اليسار لعرض التفاصيل',
      clickToWatchVideo: 'انقر لمشاهدة الفيديو',
      videoWillAutoPlay: 'سيتم تشغيل الفيديو تلقائياً وتتبع تقدمك',
      assignmentFile: 'ملف الواجب',
      downloadAssignment: 'تحميل الواجب',
      reviewed: 'تمت المراجعة',
      gradeColon: 'الدرجة:',
      instructorFeedback: 'ملاحظات المدرس:',
      pendingGrading: 'في انتظار التقييم',
      assignmentSubmittedSuccessfully: 'تم تقديم واجبك بنجاح وهو في انتظار مراجعة المدرس.',
      currentGrade50Pending: 'الدرجة الحالية: 50٪ (سيتم التحديث بعد المراجعة)',
      deadlinePassed: 'انتهى الموعد النهائي',
      assignmentDeadlinePassed: 'انتهى الموعد النهائي لهذا الواجب.',
      projectDeadlinePassed: 'انتهى الموعد النهائي لهذا المشروع.',
      gradeFailed: 'الدرجة: 0٪ (راسب)',
      deadlineWas: 'كان الموعد النهائي:',
      submitYourWork: 'قدم عملك',
      uploadCompletedAssignmentRar: 'يرجى تحميل واجبك المكتمل كملف .rar أو .zip',
      deadline: 'الموعد النهائي:',
      uploadingAssignment: 'جارٍ تحميل الواجب...',
      projectTutorialVideo: 'فيديو تعليمي للمشروع',
      watchTutorialToUnderstandRequirements: 'شاهد الفيديو التعليمي لفهم متطلبات المشروع',
      watchTutorial: 'مشاهدة الفيديو',
      starterFiles: 'الملفات الأولية',
      downloadStarterFiles: 'تحميل الملفات الأولية',
      projectSubmittedSuccessfully: 'تم تقديم مشروعك بنجاح وهو في انتظار مراجعة المدرس.',
      submitYourProject: 'قدم مشروعك',
      uploadCompletedProjectRar: 'يرجى تحميل مشروعك المكتمل كملف .rar',
      uploadingProject: 'جارٍ تحميل المشروع...',
      
      // Help Center Additional - Arabic
      foundResults: 'تم العثور على',
      result: 'نتيجة',
      results: 'نتائج',
      all: 'الكل',
      noResultsFound: 'لم يتم العثور على نتائج',
      tryDifferentKeywords: 'جرب كلمات بحث مختلفة أو تصفح جميع الفئات',
      stillNeedHelp: 'لا تزال بحاجة إلى مساعدة؟',
      ourSupportTeamIsHere: 'فريق الدعم لدينا هنا لمساعدتك',
      emailSupport: 'الدعم عبر البريد الإلكتروني',
      messageAdmin: 'راسل المسؤول',
      
      // Additional status translations - Arabic
      notWatched: 'لم تتم المشاهدة',
      watched: 'تمت المشاهدة',
      notSubmitted: 'لم يتم التقديم',
      pendingReview: 'قيد المراجعة',
      completed: 'مكتمل',
      
      // Help Article Tags - Arabic
      gettingStarted: 'البدء',
      paymentsAndBilling: 'المدفوعات والفواتير',
      signup: 'تسجيل',
      enroll: 'تسجيل',
      apply: 'التقديم',
      become: 'أن تصبح',
      setup: 'إعداد',
      manage: 'إدارة',
      monitor: 'مراقبة',
      grading: 'التقييم',
      evaluation: 'تقييم',
      marks: 'علامات',
      method: 'طريقة',
      bank: 'بنك',
      moneyBack: 'استرداد الأموال',
      return: 'إرجاع',
      cancellation: 'إلغاء',
      proof: 'إثبات',
      issues: 'مشاكل',
      problems: 'مشاكل',
      stuck: 'عالق',
      error: 'خطأ',
      browse: 'تصفح',
      photo: 'صورة',
      homework: 'واجب منزلي'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
