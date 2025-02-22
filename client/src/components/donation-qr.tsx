import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function DonationQR() {
  const { t } = useTranslation();
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Support Our Project</CardTitle>
        <CardDescription>Scan the QR code to donate Bitcoin</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <img 
          src="/BTC.png" 
          alt="Bitcoin Donation QR Code"
          className="w-48 h-48 object-contain"
        />
        <p className="text-sm text-muted-foreground text-center">
          Your support helps us maintain and improve this educational platform.
          Thank you for your contribution!
        </p>
      </CardContent>
    </Card>
  );
}
