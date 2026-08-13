import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Dumbbell, FilePenLine, Headphones, Layers3, TimerReset, Trophy, WholeWord } from "lucide-react";
import { AppShell } from "./components/AppShell";

export default function Home() {
  return (
    <AppShell>
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <span className="eyebrow">ОГЭ · русский язык · 2027</span>
              <h1 className="display">Услышать.<br />Понять. <em>Сжать.</em></h1>
              <p className="lead">Полный интерактивный курс по сжатому изложению для 9 класса: от первой микротемы до уверенной работы на экзамене.</p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/theory">Начать обучение <ArrowRight size={18} /></Link>
                <Link className="button button-secondary" href="/audio"><Headphones size={18} /> Слушать аудио</Link>
              </div>
            </div>
            <aside className="hero-card" aria-label="Критерии оценивания">
              <span className="hero-card-label">Цель курса</span>
              <h2>Забрать все 6 баллов за изложение</h2>
              <div className="score-row">
                <div className="score-box"><strong>2</strong><span>содержание</span></div>
                <div className="score-box"><strong>2</strong><span>сжатие</span></div>
                <div className="score-box"><strong>2</strong><span>связность</span></div>
              </div>
              <div className="author-note">По программе Анны Кроневальд</div>
            </aside>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="stat-grid">
              <div className="stat"><div className="stat-top"><Layers3 size={21} /><span>курс</span></div><strong>3</strong><span>последовательных блока</span></div>
              <div className="stat"><div className="stat-top"><BookOpen size={21} /><span>теория</span></div><strong>6</strong><span>коротких уроков</span></div>
              <div className="stat"><div className="stat-top"><Dumbbell size={21} /><span>практика</span></div><strong>26</strong><span>упражнений с разбором</span></div>
              <div className="stat"><div className="stat-top"><WholeWord size={21} /><span>минимум</span></div><strong>70</strong><span>слов в изложении</span></div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head">
              <div><span className="eyebrow">Твой маршрут</span><h2 className="section-title">От понимания — к навыку</h2></div>
              <p className="section-copy">Каждый этап продолжает предыдущий. Ответы и выполненные задания сохраняются на этом устройстве автоматически.</p>
            </div>
            <div className="path-grid path-grid-four">
              <Link href="/theory" className="path-card"><span className="path-number">01 / РАЗОБРАТЬСЯ</span><span className="path-icon"><BookOpen /></span><h3>Понять систему</h3><p>Как слушать, находить микротемы, сжимать и проверять работу по критериям.</p><span className="arrow-link">6 уроков <ArrowRight size={17} /></span></Link>
              <Link href="/practice" className="path-card"><span className="path-number">02 / НАТРЕНИРОВАТЬ</span><span className="path-icon"><Dumbbell /></span><h3>Решать по шагам</h3><p>Абзацы, три приёма сжатия и редактура чужих ошибок с образцами ответа.</p><span className="arrow-link">26 заданий <ArrowRight size={17} /></span></Link>
              <Link href="/audio" className="path-card"><span className="path-number">03 / УСЛЫШАТЬ</span><span className="path-icon"><Headphones /></span><h3>Работать с аудио</h3><p>Живой каталог текстов: два прослушивания, исходник для сверки и собственное изложение.</p><span className="arrow-link">Открыть аудиокаталог <ArrowRight size={17} /></span></Link>
              <Link href="/simulator" className="path-card"><span className="path-number">04 / ПРОВЕРИТЬ</span><span className="path-icon"><FilePenLine /></span><h3>Пройти репетицию</h3><p>Два чтения, таймер, поле для чистовика, счётчик слов и финальный чек-лист.</p><span className="arrow-link">Начать экзамен <ArrowRight size={17} /></span></Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="quote-band">
              <div className="quote-mark">“</div>
              <blockquote>Уверенность приходит не от таланта, а от практики. Каждое выполненное задание — ещё один шаг к результату.<cite>Дорогу осилит идущий.</cite></blockquote>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head"><div><span className="eyebrow">Что останется с тобой</span><h2 className="section-title">Навыки для экзамена</h2></div></div>
            <div className="stat-grid">
              <div className="stat"><div className="stat-top"><CheckCircle2 size={21} /></div><strong>01</strong><span>Слышать три микротемы</span></div>
              <div className="stat"><div className="stat-top"><TimerReset size={21} /></div><strong>02</strong><span>Работать между чтениями</span></div>
              <div className="stat"><div className="stat-top"><WholeWord size={21} /></div><strong>03</strong><span>Сжимать без потери смысла</span></div>
              <div className="stat"><div className="stat-top"><Trophy size={21} /></div><strong>04</strong><span>Самостоятельно проверять текст</span></div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
