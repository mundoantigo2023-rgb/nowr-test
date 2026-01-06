import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import NowrBrandLogo from "@/components/NowrBrandLogo";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <NowrBrandLogo size="sm" />
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-73px)]">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOWR ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you use our adult social connection platform.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using NOWR, you consent to the data practices described in this policy. We encourage you to read this document carefully and contact us with any questions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">2. Information We Collect</h2>
            
            <div className="space-y-3">
              <h3 className="text-base font-medium text-foreground/90">2.1 Information You Provide</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Account Information:</strong> Email address, password, date of birth, display name</li>
                <li><strong>Profile Data:</strong> Photos, bio, preferences, intention tags</li>
                <li><strong>Communications:</strong> Messages sent through the platform, support requests</li>
                <li><strong>Payment Information:</strong> Billing details for Prime subscriptions (processed securely by third-party providers)</li>
                <li><strong>Verification Data:</strong> Age verification documentation when required</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-medium text-foreground/90">2.2 Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li><strong>Device Information:</strong> Device type, operating system, browser type, unique device identifiers</li>
                <li><strong>Location Data:</strong> Approximate location based on IP address or GPS (with your consent)</li>
                <li><strong>Usage Data:</strong> Features used, time spent on platform, interaction patterns</li>
                <li><strong>Log Data:</strong> Access times, pages viewed, app crashes, system activity</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Match you with other users based on your preferences and location</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
              <li>Personalize and improve your experience</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">4. Information Sharing & Disclosure</h2>
            <p className="text-muted-foreground leading-relaxed">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>With Other Users:</strong> Profile information you choose to make visible</li>
              <li><strong>Service Providers:</strong> Third parties who perform services on our behalf (hosting, analytics, payment processing)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Safety:</strong> To protect the rights, property, and safety of NOWR, our users, or others</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement industry-standard security measures to protect your personal information, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>End-to-end encryption for messages</li>
              <li>Secure HTTPS connections</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Strict access controls for employee data access</li>
              <li>Secure data centers with physical and digital protections</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              While we strive to protect your data, no method of transmission over the internet is 100% secure. You are responsible for maintaining the confidentiality of your account credentials.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">6. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as your account is active or as needed to provide you services. After account deletion:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Profile data is deleted within 30 days</li>
              <li>Messages are removed from our active systems within 90 days</li>
              <li>Anonymized analytics data may be retained indefinitely</li>
              <li>Legal compliance records may be retained as required by law</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">7. Your Rights & Choices</h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Restriction:</strong> Request limited processing of your data</li>
              <li><strong>Withdraw Consent:</strong> Withdraw previously given consent at any time</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              To exercise these rights, contact us through the app or at privacy@nowr.app. We will respond within 30 days.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">8. Location Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOWR uses location data to connect you with nearby users. You can control location sharing through:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Device-level permissions in your phone settings</li>
              <li>In-app privacy settings (Invisible Mode)</li>
              <li>Precision controls (exact vs. approximate location)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Disabling location services may limit certain features of the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">9. Cookies & Tracking</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies to improve your experience, analyze usage patterns, and deliver personalized content. You can manage cookie preferences through your browser settings, though some features may not function properly if cookies are disabled.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">10. Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">11. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable data protection laws.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">12. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOWR is strictly for adults aged 18 and older. We do not knowingly collect personal information from anyone under 18. If we discover that we have collected data from a minor, we will delete it immediately. If you believe a minor has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">13. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of significant changes through the app or via email. Your continued use of NOWR after changes are posted constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="space-y-4 pb-8">
            <h2 className="text-lg font-medium text-foreground">14. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions, concerns, or requests regarding your privacy or this policy, please contact us:
            </p>
            <ul className="list-none text-muted-foreground space-y-1 ml-4">
              <li>Email: privacy@nowr.app</li>
              <li>In-app: Settings → Support → Privacy Inquiry</li>
            </ul>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Privacy;
