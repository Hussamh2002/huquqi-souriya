-- مخطط أولي فقط. راجعه واختبره قبل الاستخدام العام.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'طالب',
  role text not null default 'student' check (role in ('student','moderator')),
  created_at timestamptz not null default now()
);

create table if not exists public.summaries (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  subject text not null check (char_length(subject) between 2 and 120),
  study_year smallint not null check (study_year between 1 and 4),
  description text not null check (char_length(description) between 3 and 3000),
  file_path text,
  author_id uuid not null references public.profiles(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.summaries enable row level security;

-- المستخدم يرى ملفه الشخصي فقط افتراضياً.
create policy "read own profile" on public.profiles for select
  using (auth.uid() = id);
create policy "update own display name" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

-- كل مستخدم مسجل يمكنه قراءة الملخصات المعتمدة.
create policy "read approved summaries" on public.summaries for select
  using (status = 'approved' or author_id = auth.uid());

-- المستخدم المسجل يستطيع إرسال ملخص قيد المراجعة؛ لا يسمح للعميل باعتماد نفسه.
create policy "submit own pending summary" on public.summaries for insert
  with check (author_id = auth.uid() and status = 'pending');

-- ملاحظة: سياسات تعديل/حذف المشرفين يجب تنفيذها بعد إنشاء آلية آمنة
-- لتعيين دور moderator من جهة موثوقة. لا تعتمد على role يرسله المتصفح.
