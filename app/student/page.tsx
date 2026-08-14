import { AppShell } from "../components/AppShell";
import { StudentDashboard } from "./StudentDashboard";

export const dynamic = "force-dynamic";

export default function StudentPage() {
  return <AppShell><main><section className="page-intro"><div className="container page-intro-grid"><div><span className="eyebrow">Личный кабинет</span><h1 className="page-title">Мои результаты</h1><p>Отправляй работы учителю, получай баллы и комментарии и возвращайся к заданиям, которые стоит доработать.</p></div></div></section><section className="main"><div className="container"><StudentDashboard /></div></section></main></AppShell>;
}
