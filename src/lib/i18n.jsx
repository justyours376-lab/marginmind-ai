import React, { createContext, useContext, useState } from 'react';
import { extra as extraBase } from '@/lib/i18nExtra';
import { shell } from '@/lib/i18nShell';
import { ceo } from '@/lib/i18nCeo';
import { ops } from '@/lib/i18nOps';
import { agr } from '@/lib/i18nAgreements';
import { retention } from '@/lib/i18nRetention';

const extra = Object.fromEntries(Object.keys(extraBase).map((l) => [l, { ...extraBase[l], ...shell[l], ...ceo[l], ...ops[l], ...agr[l], ...retention[l] }]));

const dict = {
  en: {
    appName: 'MarginMind AI', tagline: 'Your AI dropshipping assistant',
    home: 'Home', chat: 'Chat', products: 'Products', orders: 'Orders', settings: 'Settings',
    welcome: 'Good to see you', todaySummary: "Today's summary",
    foundWeek: 'Products found this week', inProgress: 'Orders in progress', profitMonth: 'Profit this month', attention: 'Needs attention',
    recentNotifs: 'Recent notifications', noNotifs: 'No notifications yet.', demo: 'Demo mode', live: 'Live (n8n)', checkSales: 'Check sales now', openChat: 'Start with the agent',
    greeting: 'Namaste! Which niche should we explore?',
    cosmetics: 'Cosmetics', homeNiche: 'Home', profitable: 'Most profitable',
    scanning: 'Scanning trends…', pickProduct: 'Here are {n} products. Tap one to research its supplier.',
    price: 'eBay price', cost: 'Alibaba cost', shipping: 'Shipping', fee: 'eBay fee', profit: 'Profit', margin: 'Margin',
    researching: 'Researching supplier…', supplierReport: 'Supplier report', years: 'Years in business', rating: 'Rating', response: 'Response rate', ontime: 'On-time delivery', reliability: 'Reliability score',
    policySafe: 'Policy-safe: manufacturer/wholesaler, you stay seller of record', policyFail: 'Not policy-safe: retail arbitrage risk',
    requestRfq: 'Request quote (RFQ)', rfqSent: 'RFQ sent to supplier. Quote received:', quote: 'Quote', unitPrice: 'Unit price', qty: 'Quantity', total: 'Order total',
    approvePay: 'Approve and Pay', waiting: 'I will not order anything until you approve.', overCap: 'This total is above your spend cap. Are you sure?', confirmAnyway: 'Yes, approve anyway', cancel: 'Cancel',
    placing: 'Placing order and creating listing…', ordered: 'Order status: Ordered', listingLive: 'Listing is live', viewListing: 'View listing', startOver: 'New search', demoNoCharge: 'Demo mode: no real payment was made.',
    noProducts: 'No products scanned yet. Pick a niche in Chat.', noOrders: 'No orders yet.',
    awaiting_approval: 'Awaiting approval', ordered_s: 'Ordered', shipped: 'Shipped', delivered: 'Delivered', sold: 'Sold',
    accounts: 'Connected accounts', connected: 'Connected', notConnected: 'Not connected', webhooks: 'n8n webhook URLs',
    trendScan: 'Trend Scan', supplierResearch: 'Supplier Research', orderList: 'Order + List', saleWatch: 'Sale Watch',
    spendCap: 'Spend cap (USD)', notifEmail: 'Notification email', language: 'Language', save: 'Save', saved: 'Saved', auditLog: 'Audit log', noAudit: 'No approvals yet.', logout: 'Log out',
    step: 'Step', next: 'Next', back: 'Back', comingSoon: 'Coming soon', beta: 'Beta',
    s1: 'Choose your sales channel', s2: 'Connect your channel', s3: 'Choose wholesale source', s4: 'Add payment method', s5: 'You are ready!',
    appId: 'App ID (Client ID)', certId: 'Cert ID (Client Secret)', oauthToken: 'OAuth user token', shopDomain: 'Shop domain', adminToken: 'Admin API token',
    noPassword: 'We never ask for your password. API keys and OAuth tokens only — stored encrypted.', alibabaKey: 'Alibaba API key',
    payType: 'Method type', payLabel: 'Nickname', last4: 'Last 4 digits', payNote: 'We store only a label and last 4 digits, never full card numbers.',
    readyText: 'Your store is set up. You can also skip keys and explore with demo data.', go: 'Go to my dashboard', skip: 'Skip for now', saving: 'Saving…',
  },
  ne: {
    appName: 'मार्जिनमाइन्ड एआई', tagline: 'तपाईंको एआई ड्रपशिपिङ सहायक',
    home: 'गृह', chat: 'च्याट', products: 'उत्पादन', orders: 'अर्डर', settings: 'सेटिङ',
    welcome: 'स्वागत छ', todaySummary: 'आजको सारांश',
    foundWeek: 'यो हप्ता भेटिएका उत्पादन', inProgress: 'प्रक्रियामा अर्डर', profitMonth: 'यो महिनाको नाफा', attention: 'ध्यान चाहिने',
    recentNotifs: 'हालका सूचनाहरू', noNotifs: 'अहिलेसम्म कुनै सूचना छैन।', demo: 'डेमो मोड', live: 'लाइभ (n8n)', checkSales: 'बिक्री जाँच गर्नुहोस्', openChat: 'एजेन्टसँग सुरु गर्नुहोस्',
    greeting: 'नमस्ते! कुन क्षेत्र हेर्ने?',
    cosmetics: 'सौन्दर्य सामग्री', homeNiche: 'घरायसी', profitable: 'सबैभन्दा नाफामूलक',
    scanning: 'ट्रेन्ड खोज्दै…', pickProduct: 'यहाँ {n} उत्पादन छन्। आपूर्तिकर्ता जाँच गर्न एउटा छान्नुहोस्।',
    price: 'eBay मूल्य', cost: 'Alibaba लागत', shipping: 'ढुवानी', fee: 'eBay शुल्क', profit: 'नाफा', margin: 'मार्जिन',
    researching: 'आपूर्तिकर्ता जाँच्दै…', supplierReport: 'आपूर्तिकर्ता रिपोर्ट', years: 'व्यवसायमा वर्ष', rating: 'रेटिङ', response: 'जवाफ दर', ontime: 'समयमै डेलिभरी', reliability: 'विश्वसनीयता अंक',
    policySafe: 'नीति-सुरक्षित: उत्पादक/थोक विक्रेता, तपाईं नै विक्रेता', policyFail: 'नीति-सुरक्षित छैन: खुद्रा आर्बिट्रेज जोखिम',
    requestRfq: 'मूल्य माग (RFQ)', rfqSent: 'RFQ पठाइयो। मूल्य प्राप्त भयो:', quote: 'मूल्य प्रस्ताव', unitPrice: 'एकाइ मूल्य', qty: 'परिमाण', total: 'जम्मा रकम',
    approvePay: 'स्वीकृत र भुक्तानी', waiting: 'तपाईंको स्वीकृति बिना म केही अर्डर गर्दिनँ।', overCap: 'यो रकम तपाईंको खर्च सीमाभन्दा बढी छ। पक्का हो?', confirmAnyway: 'हो, स्वीकृत गर्नुहोस्', cancel: 'रद्द',
    placing: 'अर्डर र लिस्टिङ बनाउँदै…', ordered: 'अर्डर स्थिति: अर्डर गरियो', listingLive: 'लिस्टिङ लाइभ छ', viewListing: 'लिस्टिङ हेर्नुहोस्', startOver: 'नयाँ खोज', demoNoCharge: 'डेमो मोड: कुनै वास्तविक भुक्तानी भएन।',
    noProducts: 'अहिलेसम्म उत्पादन छैन। च्याटमा क्षेत्र छान्नुहोस्।', noOrders: 'अहिलेसम्म अर्डर छैन।',
    awaiting_approval: 'स्वीकृति पर्खँदै', ordered_s: 'अर्डर गरियो', shipped: 'पठाइयो', delivered: 'डेलिभर भयो', sold: 'बिक्री भयो',
    accounts: 'जोडिएका खाता', connected: 'जोडियो', notConnected: 'जोडिएको छैन', webhooks: 'n8n वेबहुक URL',
    trendScan: 'ट्रेन्ड स्क्यान', supplierResearch: 'आपूर्तिकर्ता अनुसन्धान', orderList: 'अर्डर + लिस्ट', saleWatch: 'बिक्री निगरानी',
    spendCap: 'खर्च सीमा (USD)', notifEmail: 'सूचना इमेल', language: 'भाषा', save: 'सेभ', saved: 'सेभ भयो', auditLog: 'अडिट लग', noAudit: 'अहिलेसम्म स्वीकृति छैन।', logout: 'लग आउट',
    step: 'चरण', next: 'अर्को', back: 'पछाडि', comingSoon: 'छिट्टै आउँदै', beta: 'बेटा',
    s1: 'बिक्री च्यानल छान्नुहोस्', s2: 'च्यानल जोड्नुहोस्', s3: 'थोक स्रोत छान्नुहोस्', s4: 'भुक्तानी विधि थप्नुहोस्', s5: 'तपाईं तयार हुनुहुन्छ!',
    appId: 'App ID (Client ID)', certId: 'Cert ID (Client Secret)', oauthToken: 'OAuth टोकन', shopDomain: 'पसल डोमेन', adminToken: 'Admin API टोकन',
    noPassword: 'हामी कहिल्यै पासवर्ड माग्दैनौं। API कुञ्जी र OAuth टोकन मात्र — इन्क्रिप्ट गरी राखिन्छ।', alibabaKey: 'Alibaba API कुञ्जी',
    payType: 'विधि प्रकार', payLabel: 'नाम', last4: 'अन्तिम ४ अंक', payNote: 'हामी नाम र अन्तिम ४ अंक मात्र राख्छौं, पूरा कार्ड नम्बर होइन।',
    readyText: 'तपाईंको पसल तयार छ। कुञ्जी बिना डेमो डाटासँग पनि हेर्न सक्नुहुन्छ।', go: 'ड्यासबोर्डमा जानुहोस्', skip: 'अहिले छोड्नुहोस्', saving: 'सेभ गर्दै…',
  },
  hi: {
    appName: 'मार्जिनमाइंड एआई', tagline: 'आपका एआई ड्रॉपशिपिंग सहायक',
    home: 'होम', chat: 'चैट', products: 'उत्पाद', orders: 'ऑर्डर', settings: 'सेटिंग्स',
    welcome: 'स्वागत है', todaySummary: 'आज का सारांश',
    foundWeek: 'इस सप्ताह मिले उत्पाद', inProgress: 'प्रगति में ऑर्डर', profitMonth: 'इस महीने का मुनाफ़ा', attention: 'ध्यान चाहिए',
    recentNotifs: 'हाल की सूचनाएँ', noNotifs: 'अभी कोई सूचना नहीं।', demo: 'डेमो मोड', live: 'लाइव (n8n)', checkSales: 'बिक्री जाँचें', openChat: 'एजेंट के साथ शुरू करें',
    greeting: 'नमस्ते! कौन सी श्रेणी देखें?',
    cosmetics: 'कॉस्मेटिक्स', homeNiche: 'घर', profitable: 'सबसे लाभदायक',
    scanning: 'ट्रेंड खोज रहे हैं…', pickProduct: 'ये रहे {n} उत्पाद। सप्लायर जाँचने के लिए एक चुनें।',
    price: 'eBay कीमत', cost: 'Alibaba लागत', shipping: 'शिपिंग', fee: 'eBay शुल्क', profit: 'मुनाफ़ा', margin: 'मार्जिन',
    researching: 'सप्लायर की जाँच…', supplierReport: 'सप्लायर रिपोर्ट', years: 'व्यवसाय में वर्ष', rating: 'रेटिंग', response: 'जवाब दर', ontime: 'समय पर डिलीवरी', reliability: 'विश्वसनीयता स्कोर',
    policySafe: 'नीति-सुरक्षित: निर्माता/थोक विक्रेता, आप ही विक्रेता', policyFail: 'नीति-सुरक्षित नहीं: रिटेल आर्बिट्राज जोखिम',
    requestRfq: 'कोटेशन माँगें (RFQ)', rfqSent: 'RFQ भेजा गया। कोटेशन मिला:', quote: 'कोटेशन', unitPrice: 'इकाई मूल्य', qty: 'मात्रा', total: 'कुल राशि',
    approvePay: 'स्वीकृत और भुगतान', waiting: 'आपकी स्वीकृति के बिना मैं कुछ ऑर्डर नहीं करूँगा।', overCap: 'यह राशि आपकी खर्च सीमा से अधिक है। क्या आप निश्चित हैं?', confirmAnyway: 'हाँ, स्वीकृत करें', cancel: 'रद्द',
    placing: 'ऑर्डर और लिस्टिंग बना रहे हैं…', ordered: 'ऑर्डर स्थिति: ऑर्डर किया', listingLive: 'लिस्टिंग लाइव है', viewListing: 'लिस्टिंग देखें', startOver: 'नई खोज', demoNoCharge: 'डेमो मोड: कोई वास्तविक भुगतान नहीं हुआ।',
    noProducts: 'अभी कोई उत्पाद नहीं। चैट में श्रेणी चुनें।', noOrders: 'अभी कोई ऑर्डर नहीं।',
    awaiting_approval: 'स्वीकृति लंबित', ordered_s: 'ऑर्डर किया', shipped: 'भेजा गया', delivered: 'डिलीवर हुआ', sold: 'बिक गया',
    accounts: 'जुड़े खाते', connected: 'जुड़ा', notConnected: 'नहीं जुड़ा', webhooks: 'n8n वेबहुक URL',
    trendScan: 'ट्रेंड स्कैन', supplierResearch: 'सप्लायर रिसर्च', orderList: 'ऑर्डर + लिस्ट', saleWatch: 'सेल वॉच',
    spendCap: 'खर्च सीमा (USD)', notifEmail: 'सूचना ईमेल', language: 'भाषा', save: 'सेव', saved: 'सेव हुआ', auditLog: 'ऑडिट लॉग', noAudit: 'अभी कोई स्वीकृति नहीं।', logout: 'लॉग आउट',
    step: 'चरण', next: 'आगे', back: 'पीछे', comingSoon: 'जल्द आ रहा है', beta: 'बीटा',
    s1: 'बिक्री चैनल चुनें', s2: 'चैनल जोड़ें', s3: 'थोक स्रोत चुनें', s4: 'भुगतान विधि जोड़ें', s5: 'आप तैयार हैं!',
    appId: 'App ID (Client ID)', certId: 'Cert ID (Client Secret)', oauthToken: 'OAuth टोकन', shopDomain: 'शॉप डोमेन', adminToken: 'Admin API टोकन',
    noPassword: 'हम कभी पासवर्ड नहीं माँगते। केवल API कुंजी और OAuth टोकन — एन्क्रिप्ट करके।', alibabaKey: 'Alibaba API कुंजी',
    payType: 'विधि प्रकार', payLabel: 'नाम', last4: 'अंतिम 4 अंक', payNote: 'हम केवल नाम और अंतिम 4 अंक रखते हैं, पूरा कार्ड नंबर नहीं।',
    readyText: 'आपकी दुकान तैयार है। कुंजियों के बिना डेमो डेटा से भी देख सकते हैं।', go: 'डैशबोर्ड पर जाएँ', skip: 'अभी छोड़ें', saving: 'सेव हो रहा है…',
  },
};

const LangCtx = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLangState] = useState(localStorage.getItem('mm_lang') || 'ne');
  const setLang = (l) => { localStorage.setItem('mm_lang', l); setLangState(l); };
  const t = (k, v) => {
    let s = extra[lang]?.[k] ?? dict[lang][k] ?? extra.en[k] ?? dict.en[k] ?? k;
    if (v) for (const x in v) s = s.replaceAll(`{${x}}`, v[x]);
    return s;
  };
  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);