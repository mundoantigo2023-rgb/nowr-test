import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import NowrBrandLogo from "@/components/NowrBrandLogo";

const CommunityGuidelines = () => {
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
            <h1 className="text-2xl font-semibold text-foreground">Community Guidelines</h1>
            <p className="text-sm text-muted-foreground">Building a respectful, safe community</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">Our Principles</h2>
            <p className="text-muted-foreground leading-relaxed">
              NOWR is built on mutual respect, consent, and discretion. These guidelines exist to ensure every member can connect with confidence and feel safe within our community. Violations may result in warnings, temporary suspensions, or permanent removal from the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">1. Respect & Consent</h2>
            <div className="space-y-3">
              <div className="bg-card/50 border border-border/50 rounded-lg p-4">
                <h3 className="text-base font-medium text-foreground mb-2">Always Required</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5 text-sm">
                  <li>Obtain clear consent before sharing explicit content</li>
                  <li>Respect when someone declines or stops responding</li>
                  <li>Honor stated boundaries and preferences</li>
                  <li>Accept "no" gracefully without pressure or guilt</li>
                </ul>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h3 className="text-base font-medium text-destructive mb-2">Never Acceptable</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1.5 text-sm">
                  <li>Harassment, threats, or intimidation of any kind</li>
                  <li>Continuing contact after being blocked or ignored</li>
                  <li>Coercing or pressuring others into activities</li>
                  <li>Non-consensual sharing of images or conversations</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">2. Authenticity</h2>
            <p className="text-muted-foreground leading-relaxed">
              Be genuine in your profile and interactions. Misrepresentation undermines trust and is not tolerated.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Use your own photos</strong> — Recent images that accurately represent you</li>
              <li><strong>Be honest about intentions</strong> — Your tags should reflect what you're seeking</li>
              <li><strong>No impersonation</strong> — Don't pretend to be someone else</li>
              <li><strong>Age accuracy</strong> — You must be 18+ and truthful about your age</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">3. Privacy & Discretion</h2>
            <p className="text-muted-foreground leading-relaxed">
              Discretion is fundamental to NOWR. Protect both your privacy and that of others.
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Keep conversations private</strong> — Never share screenshots or details outside the app</li>
              <li><strong>Respect anonymity</strong> — Don't attempt to identify or "out" other users</li>
              <li><strong>Protect personal information</strong> — Be cautious about sharing identifying details</li>
              <li><strong>Honor the trust</strong> — What happens on NOWR stays on NOWR</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">4. Prohibited Content</h2>
            <p className="text-muted-foreground leading-relaxed">
              The following content will result in immediate removal and potential legal action:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Any content involving minors</li>
              <li>Non-consensual imagery of any kind</li>
              <li>Content promoting violence, self-harm, or illegal activities</li>
              <li>Hate speech, discrimination, or targeted harassment</li>
              <li>Spam, scams, or commercial solicitation</li>
              <li>Prostitution or sex trafficking</li>
              <li>Malware, phishing, or malicious links</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">5. Communication Standards</h2>
            <p className="text-muted-foreground leading-relaxed">
              Quality interactions make for a better community. Keep communications respectful and appropriate.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-primary mb-2">Do</h3>
                <ul className="text-muted-foreground space-y-1.5 text-sm">
                  <li>• Be direct about your intentions</li>
                  <li>• Engage in meaningful conversation</li>
                  <li>• Respond thoughtfully to matches</li>
                  <li>• Unmatch if you're not interested</li>
                </ul>
              </div>
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-destructive mb-2">Don't</h3>
                <ul className="text-muted-foreground space-y-1.5 text-sm">
                  <li>• Send unsolicited explicit messages</li>
                  <li>• Copy-paste generic openers</li>
                  <li>• Ghost without unmatching</li>
                  <li>• Use aggressive or vulgar language</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">6. Reporting Violations</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you encounter behavior that violates these guidelines, please report it. Your safety and the integrity of our community depend on members speaking up.
            </p>
            
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-medium text-foreground">How to Report</h3>
              <ol className="list-decimal list-inside text-muted-foreground space-y-2 text-sm">
                <li>Open the profile of the user you wish to report</li>
                <li>Tap the <strong>menu icon</strong> (three dots) in the top right</li>
                <li>Select <strong>"Report"</strong></li>
                <li>Choose the appropriate category for the violation</li>
                <li>Provide details about what happened (optional but helpful)</li>
                <li>Submit your report</li>
              </ol>
            </div>

            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-medium text-foreground">What Happens Next</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 text-sm">
                <li>All reports are reviewed by our moderation team within 24 hours</li>
                <li>Your identity is never revealed to the reported user</li>
                <li>Serious violations may result in immediate suspension</li>
                <li>We may contact you for additional information if needed</li>
                <li>You will receive a notification when action is taken</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-base font-medium text-foreground">Emergency Situations</h3>
              <p className="text-muted-foreground text-sm">
                If you believe someone is in immediate danger or you encounter evidence of illegal activity (especially involving minors), please contact local law enforcement immediately. NOWR cooperates fully with legal authorities in such matters.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-medium text-foreground">7. Consequences</h2>
            <p className="text-muted-foreground leading-relaxed">
              Violations of these guidelines will result in appropriate action based on severity:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Warning:</strong> First-time minor violations receive a formal warning</li>
              <li><strong>Temporary Suspension:</strong> Repeated or moderate violations (24h - 30 days)</li>
              <li><strong>Permanent Ban:</strong> Severe violations or repeated offenses</li>
              <li><strong>Legal Action:</strong> Criminal activity will be reported to authorities</li>
            </ul>
          </section>

          <section className="space-y-4 pb-8">
            <h2 className="text-lg font-medium text-foreground">8. Appeals</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you believe you were suspended or banned unfairly, you may submit an appeal through our support channel. Appeals are reviewed within 5 business days. Provide a clear explanation of why you believe the action was incorrect.
            </p>
            <p className="text-sm text-muted-foreground">
              Contact: support@nowr.app
            </p>
          </section>
        </div>
      </ScrollArea>
    </div>
  );
};

export default CommunityGuidelines;
