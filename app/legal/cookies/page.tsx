import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocument } from "@/components/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Политика cookie",
  description: "Информация об использовании cookie на сайте aiBazar.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiesPage() {
  return (
    <LegalDocument title="Политика cookie">
      <section>
        <h2>1. Общие положения</h2>
        <p>
          Cookie — небольшие фрагменты данных, которые сайт сохраняет в
          браузере пользователя. Некоторые идентификаторы могут относиться к
          персональным данным и обрабатываются в соответствии с
          <Link href="/legal/privacy"> Политикой персональных данных</Link>.
        </p>
      </section>

      <section>
        <h2>2. Для чего используются cookie</h2>
        <ul>
          <li>авторизация и защита пользовательской сессии;</li>
          <li>сохранение настроек интерфейса;</li>
          <li>обеспечение стабильной работы сайта;</li>
          <li>получение общей статистики посещаемости и улучшение Сервиса.</li>
        </ul>
      </section>

      <section>
        <h2>3. Управление cookie</h2>
        <p>
          Пользователь может ограничить или удалить cookie в настройках своего
          браузера. Отключение технических cookie может привести к тому, что
          вход в аккаунт и отдельные функции сайта перестанут работать.
        </p>
      </section>

      <section>
        <h2>4. Изменение Политики</h2>
        <p>
          Актуальная редакция Политики всегда размещена на этой странице.
          Изменения вступают в силу с момента публикации новой редакции.
        </p>
      </section>
    </LegalDocument>
  );
}
