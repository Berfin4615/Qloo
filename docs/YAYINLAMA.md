# CommonGround AI — GitHub ve Vercel’de yayınlama

Bu rehber GitHub Desktop kullanır; terminal komutları gerektirmez. Güncel yerel uygulama test edilmiştir, bu rehber henüz yapılmış bir yayını ifade etmez.

## 1. Kaynak kodunu GitHub’a gönder

1. GitHub Desktop’ı aç ve GitHub hesabınla giriş yap.
2. **File → Add local repository → Choose** yolundan şu klasörü seç:
   `C:\Users\Berfin\Desktop\Hackathonlar\Qloo`
3. **Changes** listesini kontrol et. `.env.local`, `node_modules` ve `.next` görünmemeli; bunlar `.gitignore` ile dışlanıyor. Gerçek API anahtarını herhangi bir dosyaya veya commit mesajına yazma.
4. Summary alanına örneğin `Improve Qloo explanations and conversation prompts` yaz. **Commit to main** (veya mevcut dalın adı) düğmesine bas.
5. Üstte **Publish repository** görünüyorsa depo adı olarak `commonground-ai` kullan. Herkese açık olması için **Keep this code private** seçimini kaldır ve yayınla. Önceden bağlı GitHub depon varsa **Push origin** ile güncelle; yeni depo oluşturman gerekmez.
6. **View on GitHub** ile kontrol et. README, LICENSE, app, lib, package.json ve package-lock.json görünmeli. `.env.local` görünmemeli. Depo görünürlüğü Public olmalı.

Resmi kaynaklar: [yerel depoyu ekleme](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-a-repository-from-your-local-computer-to-github-desktop), [GitHub’a yayınlama](https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop).

## 2. Vercel projesini oluştur

1. [Vercel](https://vercel.com/new) hesabına giriş yap. **Add New → Project** veya yeni proje sayfasından GitHub hesabını bağla.
2. `commonground-ai` deposunu bul ve **Import** seç. Depo görünmüyorsa Vercel’in GitHub izinlerinde bu depoya erişimini aç.
3. Framework **Next.js**, Root Directory **.** olsun. Build Command `npm run build`; Output Directory için Next.js varsayılanını koru. `.next` klasörünü elle yükleme.
4. Deploy etmeden **Environment Variables** bölümünü aç:

   | Alan | Değer |
   | --- | --- |
   | Name / Key | `QLOO_API_KEY` |
   | Value | `.env.local` içindeki anahtarın yalnızca değeri |
   | Environments | Production; önizleme kullanacaksan Preview da |

   Değeri tırnak eklemeden yapıştır. `QLOO_API_KEY=` kısmını değere dahil etme. `NEXT_PUBLIC_` ön eki ekleme. `.env.local` dosyasını GitHub’a yüklemek yerine bu alanı kullan.
5. **Deploy** düğmesine bas. İşlem tamamlanınca verilen `https://…vercel.app` üretim adresini aç.
6. Anahtarı ilk deploy’dan sonra eklediysen ya da değiştirdiysen yeni bir **Redeploy** başlat; eski deployment yeni değeri kendiliğinden almaz.

Resmi kaynaklar: [GitHub–Vercel bağlantısı](https://vercel.com/docs/git/vercel-for-github), [ortam değişkenlerini yönetme](https://vercel.com/docs/environment-variables/managing-environment-variables).

## 3. Yayını jüri gibi test et

1. Siteyi gizli pencerede aç. Vercel hesabına giriş istenmemeli. Giriş ekranı gelirse **Project Settings → Deployment Protection** bölümünde üretim adresinin korunmadığını kontrol et. Jüriye korumalı bir preview adresi gönderme.
2. **Live Qloo mode** ibaresini kontrol et. **Offline preview** görüyorsan üretim ortamındaki QLOO_API_KEY değerini ve redeploy işlemini kontrol et.
3. **Fill with demo profiles** → iki kişinin onayı → **Discover our connections** yolunu dene.
4. Sonuçlarda her iki kişinin katkı veren favorilerini, **How we found this connection** açıklamasını ve üç sohbet sorusunu kontrol et.
5. **Not our vibe**, **More like this**, **Surprise us** ve kategori değiştirme kontrollerini dene. Telefonunda da ekranı aç.
6. Siteye ulaşılıyor ama araştırma süresi doluyorsa Vercel Functions ayarlarındaki maksimum süreyi kontrol et. Keşif rotası 180 saniye ister; seçilen planın ve ayarların bu süreyi desteklediğini doğrula.

Resmi kaynak: [Vercel Authentication ve erişim ayarları](https://vercel.com/docs/deployment-protection/methods-to-protect-deployments/vercel-authentication).

## 4. Başvuruya ekle

- Herkese açık üretim sitesi adresi.
- Public GitHub deposu adresi.
- `docs/DEVPOST.md` içindeki başvuru metni, doğrulanmış bağlantılarla birlikte.
- Ortak favorisi olmayan iki demo profilden yeni bağlantı bulmayı, açıklamayı ve geri bildirim adımını gösteren kısa bir canlı demo videosu.

Sonraki değişikliklerde GitHub Desktop üzerinden commit ve push yapman, Vercel’in bağlı Git deposundan yeni yayın oluşturmasını sağlar. Anahtar değişikliklerinde Vercel ortam değişkenlerini ayrıca güncelle.
