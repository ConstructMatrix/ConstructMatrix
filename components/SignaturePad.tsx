"use client";

import { forwardRef } from "react";
import SignatureCanvas from "react-signature-canvas";

interface Props {
  onEnd?: () => void;
}

const SignaturePad = forwardRef<SignatureCanvas, Props>(({ onEnd }, ref) => {
  return (
    <div className="border border-border rounded-lg bg-surface-1 overflow-hidden">
      <SignatureCanvas
        ref={ref}
        penColor="#1c1917"
        canvasProps={{ className: "w-full h-[100px]", style: { width: "100%", height: 100 } }}
        onEnd={onEnd}
      />
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;
