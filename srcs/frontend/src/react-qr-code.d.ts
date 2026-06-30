declare module "react-qr-code" {
    import type { ComponentType, CSSProperties } from "react";
    interface QRCodeProps {
        value: string;
        size?: number;
        bgColor?: string;
        fgColor?: string;
        level?: "L" | "M" | "Q" | "H";
        title?: string;
        style?: React.CSSProperties;
        viewBox?: string;
    }
    const QRCode: ComponentType<QRCodeProps>;
    export default QRCode;
}
