import Image from 'next/image'
import { BrandMark } from '@/components/brand-mark'
import {
  Bird,
  Check,
  ChevronDown,
  ClipboardList,
  ImageIcon,
  Layers3,
  Leaf,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Sprout,
  Store,
  WandSparkles,
  Warehouse,
} from 'lucide-react'
import { LandingHeader } from './landing-header'
import { InventoryDemo } from './inventory-demo'
import { MarketingPreview } from './marketing-preview'
import s from './landing.module.css'

const questions = [
  {
    question: 'Ternak apa saja yang bisa dicatat?',
    answer:
      'Anda bisa mencatat sapi, domba, kambing, ayam, bebek, kerbau, dan jenis lainnya. Setiap kelompok memiliki nama, ras, kandang, jumlah dalam ekor, harga per ekor, serta batas stok minimum.',
  },
  {
    question: 'Apakah penjualan langsung mengurangi stok?',
    answer:
      'Ya. Transaksi penjualan memakai inventori yang sama. Setelah transaksi tercatat sesuai alurnya, jumlah ternak dan ringkasan penjualan ikut diperbarui. Penyesuaian jumlah di inventori tidak dihitung sebagai penjualan.',
  },
  {
    question: 'Bagaimana AI membantu membuat promosi?',
    answer:
      'AI membantu menyusun caption dari informasi usaha dan produk. Untuk poster, gunakan foto ternak Anda dalam template TERKASA, atau opsi gambar AI ketika layanannya tersedia. Anda dapat meninjau, mengedit, menyimpan draft, dan mengunduh hasilnya.',
  },
  {
    question: 'Apakah bisa dihubungkan dengan Instagram?',
    answer:
      'Pengaturan koneksi Instagram tersedia per usaha. Publikasi langsung memerlukan akun dan koneksi yang aktif. Anda juga bisa mengunduh poster dan menyalin caption untuk dibagikan sendiri. Saran waktu posting belum merupakan penjadwalan publikasi otomatis.',
  },
  {
    question: 'Bisa digunakan untuk lebih dari satu usaha?',
    answer:
      'Bisa. Satu akun dapat mengelola beberapa usaha. Pilih usaha di dashboard untuk membuka inventori, transaksi, profil, dan konten milik usaha tersebut.',
  },
]

export function LandingPage() {
  return (
    <div className={s.landing}>
      <LandingHeader />
      <main id="konten-utama">
        <section id="beranda" className={s.hero} aria-labelledby="hero-title">
          <div className={s.heroCopy}>
            <span className={s.eyebrowLight}>
              <Sprout size={17} aria-hidden="true" /> TUMBUH BERSAMA PETERNAK
              LOKAL
            </span>
            <h1 id="hero-title">
              Ternak terkelola.
              <br />
              Usaha{' '}
              <span>
                makin
                <br className={s.desktopBreak} /> berdaya.
              </span>
            </h1>
            <p>
              Lebih dekat dengan ternak Anda.
              <br className={s.desktopBreak} /> Lebih siap mengembangkan usaha.
              Kelola stok, catat penjualan, dan buat promosi dengan bantuan AI.
            </p>
            <div className={s.heroActions}>
              <a className={`${s.button} ${s.buttonLime}`} href="/login">
                Mulai kelola ternak
              </a>
              <a className={`${s.button} ${s.buttonOutline}`} href="#fitur">
                Jelajahi fitur
              </a>
            </div>
            <div className={s.heroFoot}>
              <span>
                <Check size={15} aria-hidden="true" /> Inventori & transaksi
                terhubung
              </span>
              <span>
                <Check size={15} aria-hidden="true" /> Satu tempat, lebih
                tertata
              </span>
            </div>
          </div>
          <div className={s.heroVisual}>
            <Image
              className={s.heroPhoto}
              src="/assets/landing/generated/cattle-pasture-v1.webp"
              alt="Ilustrasi sapi di padang rumput perbukitan Indonesia, dibuat dengan AI"
              width={1536}
              height={1024}
              preload
              sizes="(max-width: 760px) 100vw, 58vw"
            />
            <div className={s.heroImageShade} />
            <span className={s.photoTag}>
              <Leaf size={14} aria-hidden="true" /> Dari kandang, untuk masa
              depan.
            </span>
            <div className={s.heroInventory}>
              <div className={s.heroInventoryTop}>
                <span>
                  <Warehouse size={18} aria-hidden="true" /> Inventori ternak
                </span>
                <span>DEMO</span>
              </div>
              <div className={s.heroInventoryCount}>
                <strong>54</strong>
                <span>
                  ekor tercatat
                  <br />
                  <small>di 3 kelompok ternak</small>
                </span>
                <span className={s.miniChart} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className={s.heroInventoryTypes}>
                <span>
                  <i />
                  Sapi <b>24</b>
                </span>
                <span>
                  <i />
                  Domba <b>18</b>
                </span>
                <span>
                  <i />
                  Kambing <b>12</b>
                </span>
              </div>
            </div>
            <span className={s.photoCredit}>
              Visual ilustrasi dibuat dengan AI
            </span>
          </div>
        </section>

        <section
          className={`${s.container} ${s.speciesStrip}`}
          aria-label="Jenis ternak yang didukung"
        >
          <p>
            Beragam ternaknya.
            <br />
            <strong>Satu tempat mengelolanya.</strong>
          </p>
          <div>
            <span>
              <Warehouse aria-hidden="true" />
              Sapi
            </span>
            <span>
              <Leaf aria-hidden="true" />
              Domba
            </span>
            <span>
              <Sprout aria-hidden="true" />
              Kambing
            </span>
            <span>
              <Bird aria-hidden="true" />
              Unggas
            </span>
            <span>
              <Layers3 aria-hidden="true" />
              Ternak lainnya
            </span>
          </div>
        </section>

        <section
          id="fitur"
          className={`${s.container} ${s.features}`}
          aria-labelledby="features-title"
        >
          <div className={s.sectionHeading}>
            <div>
              <span className={s.eyebrow}>
                DIBUAT UNTUK KESEHARIAN PETERNAK
              </span>
              <h2 id="features-title">
                Lebih tertata di kandang.
                <br />
                <span>Lebih percaya diri berjualan.</span>
              </h2>
            </div>
            <p>
              Dari jumlah ternak sampai materi promosi, setiap bagian usaha
              punya tempatnya.
            </p>
          </div>
          <div className={s.featureGrid}>
            <article>
              <span className={s.featureIcon}>
                <ClipboardList aria-hidden="true" />
              </span>
              <h3>Stok jelas, setiap ekor tercatat.</h3>
              <p>
                Tambah jumlah, atur kandang, dan pantau batas stok. Sapi, domba,
                atau kambing, semuanya mudah dicari.
              </p>
              <a href="#inventori">Coba demo inventori</a>
            </article>
            <article>
              <span className={s.featureIcon}>
                <ReceiptText aria-hidden="true" />
              </span>
              <h3>Penjualan masuk, catatan rapi.</h3>
              <p>
                Catat transaksi dari stok yang sama. Lihat ringkasan usaha dan
                unduh laporan saat dibutuhkan.
              </p>
              <a href="#cara-kerja">Lihat alur kerja</a>
            </article>
            <article>
              <span className={s.featureIcon}>
                <WandSparkles aria-hidden="true" />
              </span>
              <h3>Promosi yang siap Anda poles.</h3>
              <p>
                Susun caption dengan AI dan buat poster dari foto ternak. Tinjau
                hasilnya, lalu bagikan ke pelanggan.
              </p>
              <a href="#pemasaran">Lihat contoh promosi</a>
            </article>
          </div>
        </section>

        <section
          id="inventori"
          className={s.inventorySection}
          aria-labelledby="inventory-title"
        >
          <div className={`${s.container} ${s.inventoryLayout}`}>
            <div className={s.sectionCopy}>
              <span className={s.eyebrow}>KENALI ISI KANDANG ANDA</span>
              <h2 id="inventory-title">
                Catatan kecil.
                <br />
                <span>Kendali yang besar.</span>
              </h2>
              <p>
                Tak perlu mengingat semuanya. Lihat jumlah ternak per kelompok,
                lokasi kandang, dan estimasi nilai jual dalam satu pandangan.
              </p>
              <ul className={s.checkList}>
                <li>
                  <Check aria-hidden="true" />
                  Tambah atau kurangi jumlah dalam ekor
                </li>
                <li>
                  <Check aria-hidden="true" />
                  Pisahkan jenis, ras, dan kandang
                </li>
                <li>
                  <Check aria-hidden="true" />
                  Pantau stok minimum & transaksi
                </li>
              </ul>
              <a className={`${s.button} ${s.buttonDark}`} href="/login">
                Buka inventori Anda
              </a>
              <span className={s.demoHint}>
                Coba langsung demo di samping. Data hanya ilustrasi.
              </span>
            </div>
            <InventoryDemo />
          </div>
        </section>

        <section
          id="pemasaran"
          className={`${s.container} ${s.marketingSection}`}
          aria-labelledby="marketing-title"
        >
          <MarketingPreview />
          <div className={s.sectionCopy}>
            <span className={s.eyebrow}>
              <Sparkles size={15} aria-hidden="true" /> RUANG KREATIF USAHA ANDA
            </span>
            <h2 id="marketing-title">
              Dari foto ternak,
              <br />
              <span>jadi cerita yang menarik.</span>
            </h2>
            <p>
              Usaha yang baik layak dikenal lebih luas. Jadikan foto dan
              informasi ternak Anda sebagai awal untuk caption dan poster
              promosi.
            </p>
            <div className={s.marketingPoints}>
              <div>
                <span>
                  <ImageIcon size={21} aria-hidden="true" />
                </span>
                <div>
                  <h3>Foto Anda, identitas usaha Anda.</h3>
                  <p>
                    Pilih foto asli, atur format feed atau story, lalu sesuaikan
                    materi promosi.
                  </p>
                </div>
              </div>
              <div>
                <span>
                  <Sparkles size={21} aria-hidden="true" />
                </span>
                <div>
                  <h3>AI membantu, Anda yang menentukan.</h3>
                  <p>
                    Edit caption, simpan sebagai draft, dan periksa detail
                    sebelum dibagikan.
                  </p>
                </div>
              </div>
            </div>
            <a className={`${s.button} ${s.buttonDark}`} href="/login">
              Buat promosi pertama
            </a>
            <p className={s.integrationNote}>
              Template foto tersedia. Gambar AI dan publikasi Instagram
              memerlukan layanan serta koneksi akun yang aktif.
            </p>
          </div>
        </section>

        <section
          id="cara-kerja"
          className={s.workflowSection}
          aria-labelledby="workflow-title"
        >
          <div className={s.container}>
            <div className={`${s.sectionHeading} ${s.workflowHeading}`}>
              <div>
                <span className={s.eyebrowLight}>
                  DARI KEBIASAAN, JADI KEMAJUAN
                </span>
                <h2 id="workflow-title">
                  Mulai sederhana.
                  <br />
                  <span>Tumbuh selangkah demi selangkah.</span>
                </h2>
              </div>
              <p>
                Alur yang mengikuti usaha Anda, dari catatan kandang hingga ke
                tangan pelanggan.
              </p>
            </div>
            <div className={s.workflowGrid}>
              {[
                {
                  Icon: Store,
                  title: 'Kenalkan usaha Anda',
                  copy: 'Buat akun, isi profil peternakan, dan pilih usaha yang ingin dikelola.',
                },
                {
                  Icon: PackageCheck,
                  title: 'Catat ternak & penjualan',
                  copy: 'Tambahkan kelompok ternak, jumlah, dan harga. Catat penjualan dari stok yang sama.',
                },
                {
                  Icon: Sparkles,
                  title: 'Siapkan materi promosi',
                  copy: 'Gunakan foto dan informasi ternak untuk membuat caption serta poster, lalu tinjau dan bagikan.',
                },
              ].map(({ Icon, title, copy }) => (
                <article key={title}>
                  <span className={s.workflowIcon}>
                    <Icon size={27} aria-hidden="true" />
                  </span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
            <div className={s.workflowFoot}>
              <ShieldCheck size={19} aria-hidden="true" />
              <p>
                Inventori, transaksi, dan konten tersimpan sesuai usaha yang
                Anda pilih.
              </p>
              <a href="/login">Mulai dari usaha Anda</a>
            </div>
          </div>
        </section>

        <section
          id="tanya-jawab"
          className={`${s.container} ${s.faqSection}`}
          aria-labelledby="faq-title"
        >
          <div className={s.sectionCopy}>
            <span className={s.eyebrow}>SEBELUM MULAI</span>
            <h2 id="faq-title">
              Kenalan lebih dekat
              <br />
              <span>dengan TERKASA.</span>
            </h2>
            <p>
              Beberapa hal yang mungkin ingin Anda ketahui tentang ruang kerja
              peternakan ini.
            </p>
          </div>
          <div className={s.faqList}>
            {questions.map(({ question, answer }) => (
              <details key={question}>
                <summary>
                  {question}
                  <ChevronDown size={20} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>

        <section
          className={`${s.container} ${s.ctaSection}`}
          aria-labelledby="cta-title"
        >
          <div className={s.ctaDecor} aria-hidden="true">
            <Sprout />
          </div>
          <span className={s.eyebrow}>LANGKAH BAIK UNTUK USAHA ANDA</span>
          <h2 id="cta-title">
            Rawat ternaknya.
            <br />
            <span>Kembangkan peluangnya.</span>
          </h2>
          <p>
            Mulai dari satu catatan, bangun usaha yang lebih tertata bersama
            TERKASA.
          </p>
          <a className={`${s.button} ${s.buttonDark}`} href="/login">
            Mulai bersama TERKASA
          </a>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={`${s.container} ${s.footerMain}`}>
          <div>
            <a className={s.brand} href="#beranda">
              <span className={s.brandMark}>
                <BrandMark />
              </span>
              <span>
                TERKASA<span className={s.brandDot}>.</span>
              </span>
            </a>
            <p>
              Teman tumbuh UMKM peternakan.
              <br />
              Dari kandang, ke lebih banyak peluang.
            </p>
          </div>
          <div className={s.footerLinks}>
            <a href="#fitur">Fitur</a>
            <a href="#cara-kerja">Cara kerja</a>
            <a href="#tanya-jawab">Tanya jawab</a>
            <a href="/login">Masuk ke aplikasi</a>
          </div>
        </div>
        <div className={`${s.container} ${s.footerBottom}`}>
          <span>© {new Date().getFullYear()} TERKASA</span>
          <span>Inventori peternakan & pemasaran berbantuan AI</span>
          <span>Dibangun untuk peternak Indonesia.</span>
        </div>
      </footer>
    </div>
  )
}
