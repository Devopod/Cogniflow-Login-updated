/**
 * Google Apps Script: Creates a comprehensive Website Development Requirements Google Form
 * - Collects emails
 * - Organizes questions by sections
 * - Adds required fields and conditional logic pointers
 * - Links responses to a new Google Sheet
 *
 * How to use:
 * 1) Open https://script.google.com/ while logged in as the target Google account.
 * 2) New project → paste this code → Save.
 * 3) Run createWebsiteRequirementsForm() → authorize → run again.
 * 4) Check execution logs for the LIVE FORM LINK and EDIT LINK.
 */
function createWebsiteRequirementsForm() {
  // Create the form
  const form = FormApp.create('Website Development Requirements Questionnaire');
  form.setCollectEmail(true);
  form.setDescription('This form helps us understand your goals, brand, content, features, timeline, and budget. Please provide as much detail as possible. ~10–15 minutes.');
  form.setConfirmationMessage('Thanks! We\'ve received your requirements. We\'ll review and get back to you shortly.');
  form.setAllowResponseEdits(false);
  form.setLimitOneResponsePerUser(false); // Set to true if you want Google login required + 1 response
  form.setProgressBar(true);
  form.setShuffleQuestions(false);
  form.setShowLinkToRespondAgain(false);

  // Link to a new response Sheet
  const ss = SpreadsheetApp.create('Website Requirements Responses');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Utility helpers
  const addMC = (title, choices, required = false) => {
    const item = form.addMultipleChoiceItem().setTitle(title).setChoices(choices.map(c => itemChoice(c))).setRequired(required);
    return item;
  };
  const addCB = (title, choices, required = false) => {
    const item = form.addCheckboxItem().setTitle(title).setChoices(choices.map(c => itemChoice(c))).setRequired(required);
    return item;
  };
  const addSA = (title, required = false, help = '') => {
    const item = form.addTextItem().setTitle(title).setRequired(required);
    if (help) item.setHelpText(help);
    return item;
  };
  const addPARA = (title, required = false, help = '') => {
    const item = form.addParagraphTextItem().setTitle(title).setRequired(required);
    if (help) item.setHelpText(help);
    return item;
  };
  const addURL = (title, required = false) => {
    const item = form.addTextItem().setTitle(title).setRequired(required);
    const validator = FormApp.createTextValidation()
      .requireTextIsUrl()
      .build();
    item.setValidation(validator);
    return item;
  };
  const itemChoice = (title) => FormApp.createChoice(title);

  // SECTION 1: Contact & Company Info
  form.addPageBreakItem().setTitle('1) Contact & Company Info');
  addSA('Full Name', true);
  addSA('Email (we also collect emails automatically)', true);
  addSA('Phone / WhatsApp');
  addSA('Company / Organization Name');
  addURL('Company Website (if any)');
  addSA('Location / Time Zone');

  // SECTION 2: Business Overview
  form.addPageBreakItem().setTitle('2) Business Overview');
  addPARA('Describe your business, products/services, and target audience', true);
  addPARA('What makes your business unique?');

  // SECTION 3: Project Goals & Success Criteria
  form.addPageBreakItem().setTitle('3) Project Goals & Success Criteria');
  addCB('Primary objective(s) for the website', [
    'Lead generation', 'Online sales / eCommerce', 'Portfolio / showcase', 'Informational / company profile',
    'Booking / appointments', 'Community / members area', 'Landing page for a campaign', 'Other (specify below)'
  ], true);
  addPARA('If "Other" selected, please specify');
  addPARA('What does success look like in 3–6 months?');
  addCB('Key actions you want users to take', [
    'Contact form submission', 'Call / WhatsApp', 'Purchase', 'Book appointment', 'Subscribe to newsletter',
    'Download resource', 'Other (specify below)'
  ]);
  addPARA('If other user actions, please specify');

  // SECTION 4: Scope & Features
  form.addPageBreakItem().setTitle('4) Scope & Features');
  addCB('Pages needed at launch', [
    'Home', 'About', 'Services', 'Products', 'Portfolio / Case Studies', 'Blog / News', 'Contact', 'FAQs',
    'Pricing', 'Careers', 'Testimonials / Reviews', 'Legal (Privacy / Terms)', 'Custom pages (specify below)'
  ]);
  addPARA('If custom pages, list them');
  addCB('Specific features required', [
    'Contact forms', 'Quote / estimate form', 'Booking / appointments', 'Live chat / WhatsApp widget',
    'Newsletter signup', 'Blog / CMS', 'eCommerce (products, cart, checkout, payments)', 'Membership / login area',
    'Multi-language', 'Map / store locator', 'File downloads / resources',
    'Integrations (CRM, email marketing, analytics, chat, booking, accounting, payments, etc.)', 'Other (specify below)'
  ]);
  addPARA('List any specific third-party integrations (CRM, email marketing, analytics, chat, booking, accounting, payments)');
  addPARA('If eCommerce: number of products, payment gateways, shipping/tax rules (answer only if applicable)');
  addPARA('If memberships: roles, content access rules, signup/approval flow (answer only if applicable)');

  // SECTION 5: Content & Assets
  form.addPageBreakItem().setTitle('5) Content & Assets');
  addMC('Who will provide content?', [
    'We will provide all content', 'We need content support (copywriting)', 'A mix of both'
  ]);
  addCB('Do you have brand assets?', [
    'Logo (vector preferred: .ai/.eps/.svg)', 'Brand colors', 'Typography', 'Brand guidelines', 'Imagery / illustrations',
    'None yet; need branding help'
  ]);
  addPARA('Upload links or provide URLs to assets (Drive/Dropbox/WeTransfer links)');
  addMC('Do you need stock photos/illustrations?', ['Yes', 'No', 'Not sure']);

  // SECTION 6: Design & Aesthetic
  form.addPageBreakItem().setTitle('6) Design & Aesthetic');
  addSA('Brand colors (hex or names)');
  addSA('Typography preferences');
  addCB('Layout / style preferences', [
    'Minimal / clean', 'Corporate / professional', 'Bold / creative', 'Modern / tech', 'Luxury / premium',
    'Friendly / playful', 'Dark mode', 'Light / airy', 'Other'
  ]);
  addPARA('Three websites you like and why (include URLs)');
  addPARA('Websites you don\'t like and why');
  addPARA('Accessibility preferences or requirements (e.g., high contrast, larger fonts)');

  // SECTION 7: Technical & Hosting
  form.addPageBreakItem().setTitle('7) Technical & Hosting');
  addMC('Domain status', ['I already have a domain', 'I need help buying a domain', 'Not sure']);
  addCB('Hosting/CMS preferences', [
    'WordPress', 'Headless CMS (e.g., Strapi, Sanity)', 'Next.js / React', 'Static site (e.g., Astro)',
    'Shopify / WooCommerce', 'No preference — recommend best fit'
  ]);
  addMC('Admin access needed for your team?', ['Yes, multiple roles', 'Yes, single admin', 'No']);
  addMC('Do you need ongoing maintenance/support?', ['Yes (monthly retainer)', 'Yes (as-needed)', 'No']);

  // SECTION 8: SEO, Analytics & Marketing
  form.addPageBreakItem().setTitle('8) SEO, Analytics & Marketing');
  addPARA('Existing brand name/keywords to target');
  addCB('SEO needs', [
    'Basic on-page SEO', 'Technical SEO', 'Keyword research', 'Content strategy', 'Local SEO (Google Business Profile)'
  ]);
  addCB('Analytics & tracking', [
    'Google Analytics / GA4', 'Google Tag Manager', 'Facebook / Meta Pixel', 'LinkedIn Insight Tag', 'Other'
  ]);
  addCB('Email marketing / CRM', [
    'Mailchimp', 'Klaviyo', 'HubSpot', 'Zoho', 'Salesforce', 'Other'
  ]);

  // SECTION 9: Legal & Compliance
  form.addPageBreakItem().setTitle('9) Legal & Compliance');
  addCB('Compliance requirements', [
    'GDPR / Privacy', 'Cookie consent', 'Terms of Service / Privacy Policy pages', 'Accessibility (WCAG)',
    'Age restrictions', 'Industry-specific compliance (HIPAA, etc.)', 'Other'
  ]);
  addMC('Do you need our legal policy templates?', ['Yes', 'No', 'Maybe; need advice']);

  // SECTION 10: Budget & Timeline
  form.addPageBreakItem().setTitle('10) Budget & Timeline');
  addMC('Estimated budget range', ['<$1,000', '$1,000–$3,000', '$3,000–$5,000', '$5,000–$10,000', '$10,000+']);
  addSA('Desired launch date or timeframe', true);
  addPARA('Any hard deadlines or dependencies?');

  // SECTION 11: Content Migration & Training
  form.addPageBreakItem().setTitle('11) Content Migration & Training');
  addMC('Do you need migration from an existing site?', ['Yes', 'No', 'Not sure']);
  addMC('Team training needed (editor/admin workflow)?', ['Yes', 'No', 'Maybe']);

  // SECTION 12: Decision Making & Stakeholders
  form.addPageBreakItem().setTitle('12) Decision Making & Stakeholders');
  addSA('Who are the decision-makers?');
  addPARA('How will decisions be made (e.g., single approver, committee)?');
  addCB('Preferred communication channels', ['Email', 'WhatsApp', 'Slack', 'Phone', 'Video calls']);

  // SECTION 13: Final Notes & Consent
  form.addPageBreakItem().setTitle('13) Final Notes & Consent');
  addPARA('Anything else we should know?');
  addSA('How did you hear about us?');
  addCB('Consent & confirmation (tick to confirm)', ['I confirm the information provided is accurate to the best of my knowledge.'], true);

  // Optional INFO: File uploads are restricted outside Google Workspace domains.
  // If you are on Google Workspace and want to accept uploads, you can uncomment below:
  // try {
  //   const f = form.addFileUploadItem();
  //   f.setTitle('Upload relevant docs (logo, brand guidelines, copy, sitemap, examples)');
  //   f.setHelpText('Note: File upload requires respondents to sign in to Google. May require same Workspace domain.');
  // } catch (e) {
  //   // Fail silently if not supported
  // }

  // Log links
  Logger.log('LIVE FORM LINK: ' + form.getPublishedUrl());
  Logger.log('EDIT LINK (owner): ' + form.getEditUrl());
  Logger.log('RESPONSES SHEET: ' + ss.getUrl());
}