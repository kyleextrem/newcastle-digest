import React from 'react';

export const PrivacyCopyright: React.FC = () => {
  return (
    <section className="bg-[#faf9f6] min-h-screen py-20 md:py-28 px-4 md:px-8">
      <div className="container mx-auto max-w-3xl">
        <img src="/nd-logo.png" alt="Newcastle Digest" className="h-16 md:h-20 w-auto object-contain mb-12" />
        <p className="font-mono-main text-xs uppercase tracking-[0.3em] text-[#849bff] mb-4">Legal</p>
        <h1 className="font-sans-main font-black text-5xl md:text-7xl uppercase leading-[0.9] tracking-tighter text-[#251f18] mb-16">
          Privacy & Terms of Use
        </h1>

        <div className="space-y-16 font-serif-alt text-lg leading-relaxed text-[#251f18]/85">
          {/* Privacy Policy */}
          <div>
            <h2 className="font-sans-main font-black text-2xl md:text-3xl uppercase tracking-tighter text-[#251f18] mb-6">
              Privacy Policy
            </h2>
            <p className="mb-6">
              Newcastle Digest (“we”, “our”, or “us”) respects your privacy. This policy explains how we collect, use, and protect your information when you use our website and subscribe to our newsletter.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Information we collect
            </h3>
            <p className="mb-6">
              When you subscribe to our newsletter, we collect your email address. When you contact us via our website form, we collect your name, email, and message. We may also collect basic analytics (e.g. page views) to improve our site.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              How we use it
            </h3>
            <p className="mb-6">
              Your email is used to send you the Newcastle Digest newsletter and occasional updates. We do not sell or share your personal information with third parties for marketing. Our newsletter is delivered via Beehiiv, which has its own privacy policy at beehiiv.com.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Cookies
            </h3>
            <p className="mb-6">
              We use minimal cookies. Third-party services (e.g. Beehiiv, analytics) may set their own cookies. You can manage cookie preferences in your browser settings.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Unsubscribe & access
            </h3>
            <p className="mb-6">
              You can unsubscribe from our newsletter at any time via the link in every email. To request access to or deletion of your data, contact us at kyle@newcastledigest.com.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Changes
            </h3>
            <p>
              We may update this policy from time to time. Continued use of our services after changes constitutes acceptance of the updated policy. Last updated: {new Date().toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}.
            </p>
          </div>

          {/* Terms of Use */}
          <div className="pt-8 border-t border-[#251f18]/10">
            <h2 className="font-sans-main font-black text-2xl md:text-3xl uppercase tracking-tighter text-[#251f18] mb-6">
              Terms of Use
            </h2>
            <p className="mb-6">
              By accessing and using the Newcastle Digest website and newsletter, you agree to these terms.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Acceptance
            </h3>
            <p className="mb-6">
              Your use of our website, newsletter, and related services constitutes acceptance of these Terms of Use and our Privacy Policy. If you do not agree, please do not use our services.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Use of services
            </h3>
            <p className="mb-6">
              You agree to use our services only for lawful purposes. You will not use our site or newsletter to transmit harmful content, spam, or violate any laws or third-party rights. We reserve the right to suspend or terminate access at our discretion.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Accuracy
            </h3>
            <p className="mb-6">
              We strive for accuracy in our content but do not guarantee that all information—including event details, opening hours, or third-party listings—is error-free. Use our content as a guide and verify details directly with venues and organisers.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Third-party links
            </h3>
            <p className="mb-6">
              Our site and newsletter may link to third-party websites. We are not responsible for their content, privacy practices, or availability. Links do not imply endorsement.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Changes to terms
            </h3>
            <p>
              We may update these terms from time to time. Continued use after changes constitutes acceptance. We encourage you to review this page periodically.
            </p>
          </div>

          {/* Copyright */}
          <div className="pt-8 border-t border-[#251f18]/10">
            <h2 className="font-sans-main font-black text-2xl md:text-3xl uppercase tracking-tighter text-[#251f18] mb-6">
              Copyright
            </h2>
            <p className="mb-6">
              © {new Date().getFullYear()} Newcastle Digest. All rights reserved.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Ownership
            </h3>
            <p className="mb-6">
              All content on this website and in the Newcastle Digest newsletter—including text, images, logos, and design—is owned by Newcastle Digest or its licensors and is protected by Australian and international copyright laws.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Permitted use
            </h3>
            <p className="mb-6">
              You may view, download, and print content for personal, non-commercial use. You may not copy, reproduce, distribute, modify, or create derivative works without our prior written permission.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Trademarks
            </h3>
            <p className="mb-6">
              “Newcastle Digest” and the Newcastle Digest logo are trademarks of Newcastle Digest. Unauthorised use is prohibited.
            </p>

            <h3 className="font-sans-main font-black text-lg uppercase tracking-tight text-[#251f18] mt-8 mb-3">
              Takedown
            </h3>
            <p>
              If you believe content on our site infringes your copyright or other rights, contact us at kyle@newcastledigest.com with details. We will respond promptly to valid requests.
            </p>
          </div>
        </div>

        <p className="font-serif-alt italic text-[#251f18]/60 mt-16">
          Questions? Contact us at kyle@newcastledigest.com
        </p>
      </div>
    </section>
  );
};
