import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import NowrBrandLogo from "@/components/NowrBrandLogo";

const Terms = () => {
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
            <h1 className="text-2xl font-semibold text-foreground">Terms & Conditions</h1>
            <p className="text-sm text-muted-foreground">Last updated: January 2026</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using NOWR, you confirm that you are at least 18 years of age and legally capable of entering into binding agreements. You agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to these terms, you must not use this platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">2. Age Verification & Adult Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOWR is an adult-oriented platform exclusively for users aged 18 and older. By creating an account, you confirm under penalty of perjury that you meet this age requirement. We reserve the right to request proof of age at any time and to terminate accounts that violate this requirement.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              This platform may contain mature content, adult themes, and interactions of a personal nature. You acknowledge that you access such content voluntarily and at your own discretion.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">3. Consent & Interactions</h2>
            <p className="text-muted-foreground leading-relaxed">
              All interactions on NOWR must be consensual. You agree to respect the boundaries, preferences, and decisions of other users at all times. Harassment, coercion, or any form of non-consensual behavior is strictly prohibited and will result in immediate account termination.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You understand that mutual interest (a "match") does not imply consent to any specific activity. Consent must be freely given, informed, and can be withdrawn at any time.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">4. Privacy & Discretion</h2>
            <p className="text-muted-foreground leading-relaxed">
              We are committed to protecting your privacy and discretion. Your personal data is handled in accordance with our Privacy Policy and applicable data protection laws. We do not share, sell, or disclose your personal information to third parties without your explicit consent, except as required by law.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              You agree not to share, screenshot, record, or distribute any content, images, or conversations from other users without their explicit written consent. Violation of this policy will result in immediate account termination and may result in legal action.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">5. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to conduct yourself in a respectful and lawful manner. The following behaviors are prohibited:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Harassment, threats, or abusive behavior toward other users</li>
              <li>Sharing explicit content without proper consent or context</li>
              <li>Creating fake profiles or misrepresenting your identity</li>
              <li>Solicitation of illegal activities or services</li>
              <li>Spamming, scamming, or fraudulent activity</li>
              <li>Any activity that violates local, national, or international law</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">6. Content Responsibility</h2>
            <p className="text-muted-foreground leading-relaxed">
              You are solely responsible for all content you upload, share, or transmit through NOWR. You warrant that you have the legal right to share such content and that it does not infringe upon the rights of any third party.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to remove any content that violates these terms, community guidelines, or applicable law without prior notice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">7. Safety & Reporting</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your safety is important to us. We provide tools to block and report users who violate our terms or make you feel unsafe. Reports are reviewed promptly and treated with confidentiality.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you encounter illegal activity or immediate danger, please contact local authorities. NOWR cooperates with law enforcement when legally required.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">8. Premium Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOWR offers premium subscription services ("Prime") with enhanced features. Subscription fees are billed according to the selected plan and are non-refundable except as required by law. You may cancel your subscription at any time; access will continue until the end of the billing period.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">9. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOWR is provided "as is" without warranties of any kind. We do not guarantee the accuracy, reliability, or safety of any user or content on the platform. You use this service at your own risk.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We are not liable for any damages, losses, or harm arising from your use of the platform or interactions with other users. You agree to exercise caution and good judgment in all interactions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">10. Account Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our sole discretion. You may delete your account at any time through the Settings menu.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">11. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms & Conditions from time to time. Continued use of the platform after changes are posted constitutes acceptance of the revised terms. We encourage you to review this page periodically.
            </p>
          </section>

          <section className="space-y-4 pb-8">
            <h2 className="text-lg font-medium text-foreground">12. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions regarding these terms or to report violations, please contact our support team through the app or at legal@nowr.app.
            </p>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Terms;
