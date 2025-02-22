import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export default function DonationQR() {
  const { t } = useTranslation();

  return (
    <Card className="w-full max-w-sm mx-auto bg-card/50">
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-lg">Support Our Project</CardTitle>
        <CardDescription>Scan the QR code to donate Bitcoin</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-2">
        <img 
          src="/BTC.png" 
          alt="Bitcoin Donation QR Code"
          className="w-32 h-32 object-contain"
        />
        <p className="text-xs font-mono text-muted-foreground break-all text-center">
          bc1qqe8xgv60cmy3rgm0lgjvmplq0xpnkyykdsuzwv
        </p>
      </CardContent>
    </Card>
  );
}