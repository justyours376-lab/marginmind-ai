// Frontend copy of the notification and screening-reason templates in base44/shared/msgs.ts (keep the two in sync).
// Notifications store a message key + values, so they can be shown in whatever language is selected now.
const M = {
  en: {
    sale_title: 'Sold {units} × {name} (demo)', sale_msg: 'Gross profit ${gross}, ${net} after the {pct}% returns reserve (demo).',
    low_title: 'Low stock: {name} (demo)', low_msg: 'Only {n} units left. Consider reordering. (demo)',
    mkt_title: 'Marketing push: {name} (demo)', mkt_msg: 'Views are down this week. Try a 10% promotion or better photos. (demo)',
    sale_title_r: 'Sold {units} × {name}', sale_msg_r: 'Gross profit ${gross}, ${net} after the {pct}% returns reserve.',
    low_title_r: 'Low stock: {name}', low_msg_r: 'Only {n} units left. Consider reordering.',
    risk_title: 'At risk: {name} is out of stock at the supplier', risk_msg: '{supplier} has no stock left. The order is marked at risk and {n} other listing(s) of this product were paused.',
    ret_title: 'Buyer {kind}: {name}', ret_msg: 'Reply by {deadline} (3 business days). A suggested reply is ready in Orders.',
    k_return: 'return request', k_item_not_received: 'item-not-received claim', k_buyer_message: 'message', k_feedback: 'feedback',
    tok_title_soon: 'eBay connection expires soon', tok_msg_soon: 'Your eBay access expires in {days} day(s). Reconnect eBay in Settings to keep stock and sales in sync.',
    tok_title_expired: 'Reconnect eBay', tok_msg_expired: 'Your eBay access has expired. Reconnect eBay in Settings.',
    health_title: 'Account health is critical', health_msg: 'Your transaction defect rate is {tdr}%. New listing approvals are paused until it improves.',
    rep_title_price: 'Price raised: {name}', rep_msg_price: 'Supplier cost rose and the margin fell to {margin}% (floor {floor}%). Price changed from ${from} to ${to}.',
    rep_title_delist: 'Delisted: {name}', rep_msg_delist: 'The margin fell to {margin}% (floor {floor}%) and the price could not be raised enough, so the listing was ended.',
    review_title: 'Manual review needed: {name}', review_msg: 'The listing text looks suspicious ({ids}). Nothing was ordered or listed until you review it.',
    rej_source_retail: 'source is a retailer or marketplace (only wholesalers/distributors are allowed)',
    rej_no_agreement: 'no signed, unexpired wholesale agreement',
    rej_vero_unauthorized: 'brand needs eBay VeRO authorization and none is documented in the agreement',
    rej_dispatch_missing: 'the agreement has no dispatch time, so the listing handling time cannot be set',
    rej_dispatch_slow: "the supplier's proven dispatch time is longer than the handling time in the agreement",
    rej_text_claim: 'suspicious claim in the listing text', rej_ebay: 'eBay prohibited/restricted category ({ids})', rej_not_english: 'listing content must be English only',
    agr_soon_title: 'Agreement expires soon: {supplier}', agr_soon_msg: 'The agreement expires on {expiry} ({days} day(s) left). After that, products from this supplier are rejected until it is renewed.',
    agr_exp_title: 'Agreement expired: {supplier}', agr_exp_msg: 'The agreement expired on {expiry}. It is treated as not signed, so screening rejects this supplier until you renew it.',
  },
  ne: {
    sale_title: '{units} × {name} बिक्री भयो (डेमो)', sale_msg: 'कुल नाफा ${gross}, {pct}% रिटर्न रिजर्भपछि ${net} (डेमो)।',
    low_title: 'स्टक कम: {name} (डेमो)', low_msg: 'केवल {n} एकाइ बाँकी छ। फेरि अर्डर गर्ने सोच्नुहोस्। (डेमो)',
    mkt_title: 'मार्केटिङ सुझाव: {name} (डेमो)', mkt_msg: 'यो हप्ता भ्यू घटेको छ। १०% छुट वा राम्रा फोटो प्रयास गर्नुहोस्। (डेमो)',
    sale_title_r: '{units} × {name} बिक्री भयो', sale_msg_r: 'कुल नाफा ${gross}, {pct}% रिटर्न रिजर्भपछि ${net}।',
    low_title_r: 'स्टक कम: {name}', low_msg_r: 'केवल {n} एकाइ बाँकी छ। फेरि अर्डर गर्ने सोच्नुहोस्।',
    risk_title: 'जोखिम: {name} आपूर्तिकर्ताकहाँ सकिएको छ', risk_msg: '{supplier} सँग स्टक बाँकी छैन। अर्डर जोखिममा चिनाइयो र यो उत्पादनका अरू {n} लिस्टिङ रोकियो।',
    ret_title: 'खरिदकर्ताको {kind}: {name}', ret_msg: '{deadline} सम्ममा जवाफ दिनुहोस् (३ कार्यदिन)। सुझाव गरिएको जवाफ अर्डर पेजमा तयार छ।',
    k_return: 'फिर्ता अनुरोध', k_item_not_received: 'सामान नपाएको दाबी', k_buyer_message: 'सन्देश', k_feedback: 'प्रतिक्रिया',
    tok_title_soon: 'eBay जडानको म्याद चाँडै सकिँदै छ', tok_msg_soon: 'तपाईंको eBay पहुँच {days} दिनमा सकिँदै छ। स्टक र बिक्री मिलाइराख्न सेटिङमा eBay फेरि जोड्नुहोस्।',
    tok_title_expired: 'eBay फेरि जोड्नुहोस्', tok_msg_expired: 'तपाईंको eBay पहुँचको म्याद सकिएको छ। सेटिङमा eBay फेरि जोड्नुहोस्।',
    health_title: 'खाताको स्वास्थ्य गम्भीर छ', health_msg: 'तपाईंको कारोबार त्रुटि दर {tdr}% छ। यो सुध्रिएसम्म नयाँ लिस्टिङ स्वीकृति रोकिएको छ।',
    rep_title_price: 'मूल्य बढाइयो: {name}', rep_msg_price: 'आपूर्तिकर्ताको लागत बढ्दा मार्जिन {margin}% (न्यूनतम {floor}%) मा झर्‍यो। मूल्य ${from} बाट ${to} मा परिवर्तन गरियो।',
    rep_title_delist: 'लिस्टिङ हटाइयो: {name}', rep_msg_delist: 'मार्जिन {margin}% (न्यूनतम {floor}%) मा झर्‍यो र मूल्य पर्याप्त बढाउन मिलेन, त्यसैले लिस्टिङ बन्द गरियो।',
    review_title: 'म्यानुअल समीक्षा चाहिन्छ: {name}', review_msg: 'लिस्टिङ पाठ शंकास्पद देखिन्छ ({ids})। तपाईंले समीक्षा नगरेसम्म केही अर्डर वा लिस्ट गरिएन।',
    rej_source_retail: 'स्रोत खुद्रा पसल वा मार्केटप्लेस हो (थोक/वितरक मात्र अनुमति छ)',
    rej_no_agreement: 'हस्ताक्षर भएको, म्याद नसकिएको थोक सम्झौता छैन',
    rej_vero_unauthorized: 'ब्रान्डलाई eBay VeRO अनुमति चाहिन्छ र सम्झौतामा कुनै कागजात छैन',
    rej_dispatch_missing: 'सम्झौतामा पठाउने समय छैन, त्यसैले लिस्टिङको ह्यान्डलिङ समय तोक्न मिल्दैन',
    rej_dispatch_slow: 'आपूर्तिकर्ताको प्रमाणित पठाउने समय सम्झौताको ह्यान्डलिङ समयभन्दा लामो छ',
    rej_text_claim: 'लिस्टिङ पाठमा शंकास्पद दाबी', rej_ebay: 'eBay निषेधित/प्रतिबन्धित वर्ग ({ids})', rej_not_english: 'लिस्टिङ सामग्री अङ्ग्रेजीमा मात्र हुनुपर्छ',
    agr_soon_title: 'सम्झौताको म्याद चाँडै सकिँदै छ: {supplier}', agr_soon_msg: 'सम्झौताको म्याद {expiry} मा सकिन्छ ({days} दिन बाँकी)। त्यसपछि नवीकरण नगरेसम्म यो आपूर्तिकर्ताका उत्पाद अस्वीकृत हुन्छन्।',
    agr_exp_title: 'सम्झौताको म्याद सकियो: {supplier}', agr_exp_msg: 'सम्झौताको म्याद {expiry} मा सकियो। यसलाई हस्ताक्षर नभएको मानिन्छ, त्यसैले नवीकरण नगरेसम्म स्क्रिनिङले यो आपूर्तिकर्तालाई अस्वीकार गर्छ।',
  },
  hi: {
    sale_title: '{units} × {name} बिके (डेमो)', sale_msg: 'कुल मुनाफ़ा ${gross}, {pct}% रिटर्न रिज़र्व के बाद ${net} (डेमो)।',
    low_title: 'स्टॉक कम: {name} (डेमो)', low_msg: 'केवल {n} इकाइयाँ बची हैं। दोबारा ऑर्डर पर विचार करें। (डेमो)',
    mkt_title: 'मार्केटिंग सुझाव: {name} (डेमो)', mkt_msg: 'इस सप्ताह व्यू घटे हैं। 10% छूट या बेहतर फ़ोटो आज़माएँ। (डेमो)',
    sale_title_r: '{units} × {name} बिके', sale_msg_r: 'कुल मुनाफ़ा ${gross}, {pct}% रिटर्न रिज़र्व के बाद ${net}।',
    low_title_r: 'स्टॉक कम: {name}', low_msg_r: 'केवल {n} इकाइयाँ बची हैं। दोबारा ऑर्डर पर विचार करें।',
    risk_title: 'जोखिम: {name} सप्लायर के पास खत्म है', risk_msg: '{supplier} के पास स्टॉक नहीं बचा। ऑर्डर जोखिम में चिह्नित किया गया और इस उत्पाद की {n} अन्य लिस्टिंग रोकी गईं।',
    ret_title: 'खरीदार का {kind}: {name}', ret_msg: '{deadline} तक जवाब दें (3 कार्य दिवस)। सुझाया गया जवाब ऑर्डर पेज पर तैयार है।',
    k_return: 'रिटर्न अनुरोध', k_item_not_received: 'सामान न मिलने का दावा', k_buyer_message: 'संदेश', k_feedback: 'फ़ीडबैक',
    tok_title_soon: 'eBay कनेक्शन जल्द समाप्त होगा', tok_msg_soon: 'आपका eBay एक्सेस {days} दिन में समाप्त हो रहा है। स्टॉक और बिक्री सिंक रखने के लिए सेटिंग्स में eBay दोबारा जोड़ें।',
    tok_title_expired: 'eBay दोबारा जोड़ें', tok_msg_expired: 'आपका eBay एक्सेस समाप्त हो चुका है। सेटिंग्स में eBay दोबारा जोड़ें।',
    health_title: 'खाते की सेहत गंभीर है', health_msg: 'आपकी ट्रांज़ैक्शन डिफ़ेक्ट दर {tdr}% है। सुधरने तक नई लिस्टिंग मंज़ूरियाँ रोकी गई हैं।',
    rep_title_price: 'कीमत बढ़ाई गई: {name}', rep_msg_price: 'सप्लायर की लागत बढ़ने से मार्जिन {margin}% (न्यूनतम {floor}%) पर आ गया। कीमत ${from} से ${to} की गई।',
    rep_title_delist: 'लिस्टिंग हटाई गई: {name}', rep_msg_delist: 'मार्जिन {margin}% (न्यूनतम {floor}%) पर आ गया और कीमत पर्याप्त नहीं बढ़ाई जा सकी, इसलिए लिस्टिंग बंद की गई।',
    review_title: 'मैन्युअल समीक्षा ज़रूरी: {name}', review_msg: 'लिस्टिंग का पाठ संदिग्ध लगता है ({ids})। आपकी समीक्षा तक कुछ भी ऑर्डर या लिस्ट नहीं हुआ।',
    rej_source_retail: 'स्रोत रिटेलर या मार्केटप्लेस है (केवल थोक/वितरक की अनुमति है)',
    rej_no_agreement: 'हस्ताक्षरित, अनएक्सपायर्ड थोक समझौता नहीं है',
    rej_vero_unauthorized: 'ब्रांड के लिए eBay VeRO अनुमति चाहिए और समझौते में कोई दस्तावेज़ नहीं है',
    rej_dispatch_missing: 'समझौते में भेजने का समय नहीं है, इसलिए लिस्टिंग का हैंडलिंग समय तय नहीं हो सकता',
    rej_dispatch_slow: 'सप्लायर का प्रमाणित भेजने का समय समझौते के हैंडलिंग समय से अधिक है',
    rej_text_claim: 'लिस्टिंग पाठ में संदिग्ध दावा', rej_ebay: 'eBay प्रतिबंधित/सीमित श्रेणी ({ids})', rej_not_english: 'लिस्टिंग की सामग्री केवल अंग्रेज़ी में होनी चाहिए',
    agr_soon_title: 'समझौता जल्द समाप्त होगा: {supplier}', agr_soon_msg: 'समझौता {expiry} को समाप्त होगा ({days} दिन बाकी)। उसके बाद नवीनीकरण तक इस सप्लायर के उत्पाद अस्वीकृत होंगे।',
    agr_exp_title: 'समझौता समाप्त: {supplier}', agr_exp_msg: 'समझौता {expiry} को समाप्त हो गया। इसे हस्ताक्षरित नहीं माना जाता, इसलिए नवीनीकरण तक स्क्रीनिंग इस सप्लायर को अस्वीकार करती है।',
  },
};

// Same rules as the server's tr(): "{name}" placeholders; a value like "@k_return" is itself a message key.
export function tr(lang, key, vars = {}) {
  let s = (M[lang] ?? M.ne)[key] ?? M.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) {
    const val = typeof v === 'string' && v.startsWith('@') && M.en[v.slice(1)] ? tr(lang, v.slice(1)) : v;
    s = s.replaceAll(`{${k}}`, String(val));
  }
  return s;
}

// "ebay:<category>" or a plain reject code -> readable text in `lang`.
export const reasonLabel = (lang, code) => (code.startsWith('ebay:') ? tr(lang, 'rej_ebay', { ids: code.slice(5) }) : tr(lang, `rej_${code}`));