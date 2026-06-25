import React from 'react';
import { ArrowLeft, CalendarDays, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => (
  <div className="flex min-h-[75vh] items-center bg-white px-4 py-16 md:px-12">
    <div className="mx-auto w-full max-w-3xl text-center">
      <p className="font-display text-7xl font-black tracking-tighter text-brand-blue md:text-9xl">404</p>
      <h1 className="mt-4 font-display text-3xl font-black uppercase tracking-tight text-brand-black md:text-5xl">
        找不到此頁面
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-sm font-medium leading-7 text-neutral-500 md:text-base">
        此頁面可能已移動、網址輸入錯誤，或內容尚未公開
      </p>

      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-brand-black px-6 text-sm font-black text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回首頁
        </Link>
        <Link to="/schedule" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-neutral-300 px-6 text-sm font-black text-brand-black hover:border-brand-blue hover:text-brand-blue">
          <CalendarDays className="mr-2 h-4 w-4" /> 查看賽程
        </Link>
        <Link to="/news" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-neutral-300 px-6 text-sm font-black text-brand-black hover:border-brand-blue hover:text-brand-blue">
          <Newspaper className="mr-2 h-4 w-4" /> 查看最新消息
        </Link>
      </div>
    </div>
  </div>
);

export default NotFoundPage;
