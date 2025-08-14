export default function Head() {
  const title = "workeasy – 근무관리 SaaS | 랜딩";
  const description =
    "소규모 F&B 매장을 위한 교대근무 관리 SaaS. 실시간 근무 교환, 채팅, 푸시 알림을 PWA로 편리하게.";
  const image = "/easynext.png";
  const url = "/landing";
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={url} />

      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </>
  );
}
