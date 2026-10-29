// Human-readable labels for the eBay restriction category ids returned by the server.
const L = {
  counterfeit_replica: ['Counterfeit / replica', 'नक्कली / प्रतिलिपि', 'नकली / रेप्लिका'],
  weapons_firearms: ['Weapons', 'हतियार', 'हथियार'],
  ammunition_explosives: ['Ammunition / explosives', 'गोलीबारुद / विस्फोटक', 'गोला-बारूद / विस्फोटक'],
  drugs_paraphernalia: ['Drugs / paraphernalia', 'लागूपदार्थ सामग्री', 'नशीली सामग्री'],
  tobacco_vape: ['Tobacco / vape', 'सुर्ती / भेप', 'तंबाकू / वेप'],
  prescription_medical: ['Prescription / medical', 'प्रिस्क्रिप्सन / चिकित्सा', 'प्रिस्क्रिप्शन / चिकित्सा'],
  fda_food: ['Supplements / FDA-regulated', 'पूरक / खाद्य नियमन', 'सप्लीमेंट / FDA नियंत्रित'],
  animals_wildlife: ['Animal / wildlife products', 'जनावर / वन्यजन्तु उत्पादन', 'पशु / वन्यजीव उत्पाद'],
  recalled_unsafe: ['Recalled / unsafe', 'फिर्ता बोलाइएको / असुरक्षित', 'वापस बुलाया / असुरक्षित'],
  hazardous_flammable: ['Hazardous / flammable', 'खतरनाक / ज्वलनशील', 'खतरनाक / ज्वलनशील'],
  adult_only: ['Adult only', 'वयस्क मात्र', 'केवल वयस्क'],
  stolen_property: ['Stolen property', 'चोरी सम्पत्ति', 'चोरी की संपत्ति'],
  government_ids_documents: ['Government IDs / documents', 'सरकारी परिचयपत्र / कागजात', 'सरकारी पहचान पत्र / दस्तावेज़'],
  currency_detection_circumvention: ['Currency / detection circumvention', 'मुद्रा / पहिचान छल्ने सामग्री', 'मुद्रा / पहचान से बचने की सामग्री'],
  software_digital: ['Software / digital goods', 'सफ्टवेयर / डिजिटल सामान', 'सॉफ़्टवेयर / डिजिटल सामान'],
  requires_preapproval: ['Needs eBay pre-approval', 'eBay को पूर्व स्वीकृति चाहिन्छ', 'eBay की पूर्व स्वीकृति चाहिए'],
};
const IDX = { en: 0, ne: 1, hi: 2 };

export const reasonLabel = (id, lang) => (L[id] ? L[id][IDX[lang] ?? 0] : id);