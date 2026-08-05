"use client";

import { forwardRef, useEffect, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

interface Props {
  onEnd?: () => void;
}

const SignaturePad = forwardRef<SignatureCanvas, Props>(({ onEnd }, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function resizeCanvas() {
      const sigCanvas = (ref as React.MutableRefObject<SignatureCanvas | null>)?.current;
      const canvas = sigCanvas?.getCanvas();
      if (!canvas || !containerRef.current) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const width = containerRef.current.offsetWidth;
      const height = 180;

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.getContext("2d")?.scale(ratio, ratio);
      sigCanvas?.clear();
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [ref]);

  return (
    <div ref={containerRef} className="border border-border rounded-lg bg-surface-1 overflow-hidden">
      <SignatureCanvas
        ref={ref}
        penColor="#1c1917"
        backgroundColor="#f5f5f4"
        minWidth={1.5}
        maxWidth={3}
        canvasProps={{ className: "w-full", style: { width: "100%", height: 180, touchAction: "none" } }}
        onEnd={onEnd}
      />
    </div>
  );
});

SignaturePad.displayName = "SignaturePad";
export default SignaturePad;