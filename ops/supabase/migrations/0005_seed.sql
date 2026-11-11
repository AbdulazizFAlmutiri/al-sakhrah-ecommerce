insert into public.warehouses (name) values ('مستودع الرياض');

insert into public.failure_reasons (code, label_ar, label_en, label_ur, icon, sort) values
  ('closed',         'المحل مقفل',     'Store closed',   'دکان بند ہے',       'lock',               1),
  ('refused',        'رفض الاستلام',   'Refused',        'لینے سے انکار',      'block',              2),
  ('wrong_location', 'موقع خاطئ',      'Wrong location', 'غلط مقام',          'wrong_location',     3),
  ('payment',        'مشكلة في الدفع', 'Payment issue',  'ادائیگی کا مسئلہ',  'payments',           4),
  ('other',          'سبب آخر',        'Other',          'دوسری وجہ',         'more_horiz',         5);
