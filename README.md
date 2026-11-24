# Career Arena · Exam Arena

Azərbaycan dilində buraxılış imtahanına hazırlıq platforması. React/Vite frontend Flask API-si ilə işləyir; SQLite lokal/test, TLS PostgreSQL production verilənlər bazasıdır.

## Windows-da işə salmaq

Bu branch-ın ZIP arxivini kompüterə endirib tam çıxart. Python 3.12 və ya daha yeni versiya, həmçinin Node.js 22.12 və ya daha yeni versiya quraşdırılmış olmalıdır. İlk açılışda paketlər internetdən quraşdırılır.

PowerShell-də çıxartdığın qovluqdakı BASLA.cmd faylının tam yolunu yaz.

```powershell
& 'C:\Users\SizinAdınız\Downloads\Start-up-Backend\BASLA.cmd'
```

Terminalda göstərilən **Career Arena** ünvanını aç və terminalı açıq saxla. İlk açılışda yerli SQLite bazası 11 430 sualla yaradılır. Qeydiyyat kodları terminaldakı **Verification inbox** ünvanında görünür. [Ətraflı işə salma təlimatı](BASLA.md)

## Build və API yoxlaması

- `frontend` qovluğunda `npm.cmd run build` TypeScript-i yoxlayır və `dist` qovluğunu yaradır. Flask işləyərkən `npm.cmd run preview` ilə build-i lokal yoxlamaq olar.
- `backend` qovluğunda `.\.venv\Scripts\python.exe tests/smoke_integration.py` ayrıca yaddaşdaxili bazada qeydiyyat, təsdiq, sınaq, nəticə, profil, inkişaf və reytinq axınını yoxlayır.
- Statik hostda frontend marşrutları üçün `index.html` fallback və eyni origin üzərindən `/api` proxy qurulmalıdır.
- İcra olunan route-lar, giriş/CSRF tələbləri, standart limitlər və məlum API boşluqları üçün [API istinadına](docs/API.md) baxın.

## Sınaq məlumatları

Vahid sual bazası Azərbaycan dili, Riyaziyyat və İngilis dili üzrə 11 430 sualdan ibarətdir. 9-cu və 10-cu siniflərdə 3 830, 11-ci sinifdə 3 770 sual var. İmtahanda seçilən sinif, fənn və mövzu üzrə suallar təsadüfi götürülür.

Yeni baza qurmaq və ya mövcud sual bankını bu paketdən bərpa etmək üçün `backend` qovluğunda aşağıdakı əmrləri işlədin. İkinci əmr konfiqurasiya olunmuş bazanın mövcud sual bankını əvəz edir.

```powershell
python scripts/init_db.py
python scripts/replace_question_bank.py --replace
```

## Admin paneli

Saytın ünvanına `/admin` əlavə edərək admin girişini açın. Layihənin `backend` qovluğunda bu əmr mövcud, e-poçtu təsdiqlənmiş hesaba admin səlahiyyəti verir:

```powershell
python scripts/manage_admin.py grant admin@example.com
```

`admin@example.com` əvəzinə hesabın e-poçtunu yazın. Səlahiyyəti geri almaq üçün eyni əmrdə `grant` sözünü `revoke` ilə əvəz edin. Admin panelində bütün siniflərin suallarını silmək üçün `SİL` yazıb təsdiqləyin. Tamamlanmış imtahan nəticələrini istifadəçilər öz nəticə tarixçəsindən aça bilirlər.
