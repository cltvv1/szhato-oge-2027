import { Headphones, Library, UploadCloud } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { getAudioExercises } from "@/lib/audio-store";
import { AudioCatalogClient } from "./AudioCatalogClient";

export const dynamic = "force-dynamic";

export default async function AudioPage() {
  const exercises = await getAudioExercises(false, "audio");

  return (
    <AppShell>
      <main>
        <section className="page-intro audio-intro">
          <div className="container page-intro-grid">
            <div>
              <span className="eyebrow">Аудиопрактика · живой каталог</span>
              <h1 className="page-title">Слушать и писать</h1>
              <p>Свободный аудиотренажёр: выбирай запись или случайный текст, слушай в своём темпе, делай заметки и собирай сжатое изложение.</p>
            </div>
            <div className="progress-panel">
              <div className="progress-panel-top"><strong>Опубликовано</strong><span>{exercises.length}</span></div>
              <div className="audio-panel-icons"><Headphones /><Library /><UploadCloud /></div>
              <div className="progress-caption">Аудио · заметки · изложение · исходный текст</div>
            </div>
          </div>
        </section>

        <section className="main">
          <div className="container">
            {exercises.length ? <AudioCatalogClient exercises={exercises} /> : (
              <div className="empty-library">
                <span><Headphones size={38} /></span>
                <h2>Первое аудиоупражнение готовится</h2>
                <p>Автор сможет добавлять сюда тексты и записи через защищённую панель. Загляни позже — каталог будет пополняться.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
