import './globals.css';

export const metadata = {
  title: 'Arunachalam P · RTL / FPGA / VLSI Engineer',
  description: 'RTL Design, FPGA, and ASIC physical design portfolio of Arunachalam P',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="cyan">
      <body>{children}</body>
    </html>
  );
}
