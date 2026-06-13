"use client";

import DomeGallery from "./DomeGallery";

const galleryImages = [
  { src: "/images/gallery/gallery_01.jpg", alt: "SAKEC Hackathon - 2nd Runner-Up" },
  { src: "/images/gallery/gallery_02.jpg", alt: "SAKEC ChipMonk Hackathon 2026" },
  { src: "/images/gallery/gallery_03.jpg", alt: "Hardware Debug Session" },
  { src: "/images/gallery/gallery_04.jpg", alt: "Project Presentation" },
  { src: "/images/gallery/gallery_05.jpg", alt: "FFT Hardware Demo" },
  { src: "/images/gallery/gallery_06.jpg", alt: "Innovus Power Grid" },
  { src: "/images/gallery/gallery_07.jpg", alt: "Innovus Floorplan" },
  { src: "/images/gallery/gallery_08.jpg", alt: "AMD Spartan-7 FPGA Board" },
  { src: "/images/gallery/gallery_09.jpg", alt: "FPGA Board - Active Run" },
  { src: "/images/gallery/gallery_10.jpg", alt: "Place and Route Detail" },
  { src: "/images/gallery/gallery_11.jpg", alt: "3D Die View" },
];

export default function EvidenceGallery() {
  return (
    <section id="evidence" style={{ padding: "60px 0" }}>
      <div className="section-label">05 // Engineering Evidence Gallery</div>
      <p className="evidence-hint">Drag to rotate. Click any photo to view fullscreen.</p>
      <div style={{ position: "relative", width: "100%", height: "640px" }}>
        <DomeGallery
          images={galleryImages}
          fit={0.6}
          minRadius={420}
          maxRadius={900}
          padFactor={0.15}
          overlayBlurColor="#050810"
          grayscale={false}
          segments={28}
          imageBorderRadius="6px"
          openedImageBorderRadius="8px"
        />
      </div>
    </section>
  );
}
