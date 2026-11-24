# Career Arena — Windows-da işə sal

ZIP-i tam çıxart və **Career-Arena** qovluğunda **BASLA.cmd** faylını aç. Kompüterdə Python və Node.js quraşdırılmış olmalıdır. İlk işə salmada çatışmayan paketlərin quraşdırılması üçün internet bağlantısı tələb oluna bilər.

Terminal açıq qalsın. Orada göstərilən **Career Arena** ünvanı əsas saytı açır. **Login** mövcud hesabla giriş, **Registration** isə yeni hesab yaratmaq üçündür.

## Gmail ilə həqiqi e-poçt göndərişi

Göndərən Gmail hesabında iki mərhələli doğrulamanı aktivləşdir və [Google tətbiq şifrəsi](https://support.google.com/mail/answer/185833) yarat. `backend/.env` faylına göndərən hesabın məlumatlarını əlavə et. Google tətbiq şifrəsini boşluqsuz yaz.

```dotenv
SMTP_FROM=gonderen@gmail.com
SMTP_USERNAME=gonderen@gmail.com
SMTP_PASSWORD=BURAYA_TETBIQ_SIFRESI
```

Gmail ayarları tamamlandıqda `BASLA.cmd` avtomatik olaraq Gmail vasitəsilə göndərir. Bu rejim `smtp.gmail.com`, `587` portu və STARTTLS istifadə edir. `BASLA.cmd --gmail` Gmail rejimini açıq şəkildə seçir. Yerli sınaq poçt qutusu üçün `BASLA.cmd --local-mail` işlət və terminaldakı **Verification inbox** ünvanına keç.

Yerli poçt rejimində qeydiyyat və şifrə bərpa kodlarını terminalda göstərilən **Verification inbox** səhifəsindən götür.

İlk açılışda **11 430 sual** ilə yeni yerli SQLite bazası avtomatik yaradılır. Sonrakı açılışlarda mövcud yerli baza istifadə olunur. Yeni sınaqlar sualları seçilən sinif, fənn və mövzu üzrə təsadüfi götürür. Qeydiyyatdan keçəndə hesabın bu nüsxənin bazasında saxlanılır.

Hər hansı xidmət başlaya bilməsə, səbəb terminalda görünür. Servisləri dayandırmaq üçün terminalda Ctrl+C bas.

