"use client";

import { forwardRef } from "react";
import SignatureCanvas from "react-signature-canvas";

interface Props {
  onEnd?: () => void;
}

const SignaturePad = forwardRef<SignatureCanvas, Props>(({ onEnd }, ref) => {
  return (
    <div className="border border-border rounded bg-surface-1">
      <SignatureCanvas
        ref={ref}
        penColor="black"
        canvasProps={{ className: "w-full h-[90px]", style: { width: "100%", height: 90 } }}
        onEnd={onEnd}
      />
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;
