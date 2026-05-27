type Props = {
  size?: number;
  className?: string;
};

export default function DocuMindLogo({ size = 40, className }: Props) {
  return (
    <img
      className={className}
      src="/images/logo.png"
      alt="DocuMind logo"
      width={size}
      height={size}
      style={{ objectFit: 'contain' }}
    />
  );
}