import { FileText, Lock, RefreshCcw, Settings2 } from 'lucide-react';

export const LegalTerms = () => (
  <article>
    <h1>Terms & Conditions</h1>
    <p>Last updated: February 26, 2026</p>

    <h2>1. Introduction</h2>
    <p>
      Welcome to <strong>Gimxa</strong>. By accessing or using our platform, you agree to be
      bound by these Terms and Conditions. Please read them carefully before using our services.
    </p>

    <h2>2. User Accounts</h2>
    <p>To access certain features, you must create an account. You are responsible for:</p>
    <ul>
      <li>Maintaining the confidentiality of your account credentials.</li>
      <li>All activities that occur under your account.</li>
      <li>Providing accurate and complete information.</li>
    </ul>

    <h2>3. Digital Products and Delivery</h2>
    <p>We sell digital goods including game top-ups, gift cards, and software keys.</p>
    <ul>
      <li>
        <strong>Instancy:</strong> Most products are delivered immediately upon successful payment.
      </li>
      <li>
        <strong>Accuracy:</strong> You are responsible for providing correct player IDs or account
        details for top-ups.
      </li>
    </ul>

    <h2>4. Prohibited Activities</h2>
    <p>Users are strictly prohibited from:</p>
    <ul>
      <li>Using the service for any illegal purposes.</li>
      <li>Attempting to interfere with the network security.</li>
      <li>Engaging in fraudulent transactions.</li>
    </ul>
  </article>
);

export const LegalPrivacy = () => (
  <article>
    <h1>Privacy Policy</h1>
    <p>Last updated: February 26, 2026</p>

    <h2>1. Information We Collect</h2>
    <p>We collect information to provide better services to all our users. This includes:</p>
    <ul>
      <li>
        <strong>Personal Info:</strong> Name, email address, and phone number.
      </li>
      <li>
        <strong>Usage Data:</strong> How you interact with our platform.
      </li>
      <li>
        <strong>Payment Info:</strong> Processed via secure third-party providers.
      </li>
    </ul>

    <h2>2. How We Use Information</h2>
    <p>We use the data we collect to:</p>
    <ul>
      <li>Process your transactions and deliver products.</li>
      <li>Improve our services and user experience.</li>
      <li>Send important security alerts and updates.</li>
    </ul>

    <h2>3. Data Protection</h2>
    <p>
      We implement a variety of security measures to maintain the safety of your personal
      information. We do not sell, trade, or otherwise transfer your personal data to outside
      parties without your consent.
    </p>
  </article>
);

export const LegalRefund = () => (
  <article>
    <h1>Refund Policy</h1>
    <p>Last updated: February 26, 2026</p>

    <h2>1. Digital Goods Finality</h2>
    <p>
      Due to the nature of digital goods (keys and top-ups), all sales are generally{' '}
      <strong>final and non-refundable</strong> once the item has been delivered or the top-up has
      been processed.
    </p>

    <h2>2. Exceptions for Refunds</h2>
    <p>Refunds may be considered in the following rare circumstances:</p>
    <ul>
      <li>The digital key is proven to be invalid or already redeemed prior to purchase.</li>
      <li>A technical error occurred on our side preventing delivery.</li>
      <li>The purchase was made fraudulently and reported immediately.</li>
    </ul>

    <h2>3. Request Process</h2>
    <p>
      To request a refund, please open a support ticket with your Order ID and evidence of the
      issue. Requests must be made within 48 hours of purchase.
    </p>
  </article>
);

export const LegalConsent = () => (
  <article>
    <h1>Consent Preferences</h1>
    <p>Manage how we use your data and cookies.</p>

    <h2>1. Essential Cookies</h2>
    <p>
      These are necessary for the website to function (e.g., authentication, cart persistence). They
      cannot be disabled.
    </p>

    <h2>2. Analytical Cookies</h2>
    <p>
      We use these to understand how visitors use our site, helping us improve the experience. You
      can opt-out of these in your browser settings.
    </p>

    <h2>3. Marketing Consent</h2>
    <p>
      By opting in, you agree to receive newsletters and promotional offers via email. You can
      unsubscribe at any time using the link in our emails.
    </p>
  </article>
);

export const LEGAL_DOCS = [
  {
    id: 'terms',
    label: 'Terms & Conditions',
    icon: FileText,
    component: LegalTerms,
  },
  {
    id: 'privacy',
    label: 'Privacy Policy',
    icon: Lock,
    component: LegalPrivacy,
  },
  {
    id: 'refund',
    label: 'Refund Policy',
    icon: RefreshCcw,
    component: LegalRefund,
  },
  {
    id: 'consent',
    label: 'Consent Preferences',
    icon: Settings2,
    component: LegalConsent,
  },
];
