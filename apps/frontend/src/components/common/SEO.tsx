import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  author?: string;
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords,
  author
}) => {
  const appName = "EmotiAnalyze";
  const fullTitle = `${title} | ${appName}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {author && <meta name="author" content={author} />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {/* <meta property="og:image" content="URL_to_your_image.jpg" /> */}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      {/* <meta property="twitter:image" content="URL_to_your_image.jpg" /> */}
    </Helmet>
  );
};

export default SEO; 