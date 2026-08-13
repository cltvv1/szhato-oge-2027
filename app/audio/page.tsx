import { Headphones, Library, UploadCloud } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { getAudioExercises } from "@/lib/audio-store";
import { AudioExerciseCard } from "./AudioExerciseCard";

export const dynamic = "force-dynamic";

export default async function AudioPage() {
  const exercises = await getAudioExercises(false);

  return (
    <AppShell>
      <main>
        <section className="page-intro audio-intro">
          <div className="container page-intro-grid">
            <div>
              <span className="eyebrow">Аудиопрактика · живой каталог</span>
              <h1 className="page-title">Слушать и писать</h1>
              <p>Полноценные упражнения с аудиозаписями: прослушай текст два раза, составь заметки и напиши сжатое изложение. Новые варианты появляются здесь после публикации автором.</p>
            </div>
            <div className="progress-panel">
              <div className="progress-panel-top"><strong>Опубликовано</strong><span>{exercises.length}</span></div>
              <div className="audio-panel-icons"><Headphones /><Library /><UploadCloud /></div>
              <div className="progress-caption">Аудио · исходный текст · поле для ответа</div>
            </div>
          </div>
        </section>

        <section className="main">
          <div className="container">
            {exercises.length ? (
              <div className="audio-exercise-list">
                {exercises.map((exercise, index) => <AudioExerciseCard key={exercise.id} exercise={exercise} index={index} />)}
              </div>
            ) : (
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

