-- ================================
-- TABLE : profils
-- ================================
create table if not exists public.profils (
    id uuid primary key references auth.users(id) on delete cascade,
    nom_complet text,
    email text unique,
    photo_url text,
    entreprise_active_id uuid,
    cree_le timestamptz default now()
);

-- ================================
-- TABLE : entreprises
-- ================================
create table if not exists public.entreprises (
    id uuid primary key default gen_random_uuid(),
    nom text not null,
    description text,
    devise text not null default 'USD',
    theme text not null default '#2d3436',
    logo_url text,
    cree_par uuid not null references public.profils(id) on delete cascade,
    cree_le timestamptz default now()
);

-- ================================
-- TABLE : membres_entreprise
-- ================================
create table if not exists public.membres_entreprise (
    id uuid primary key default gen_random_uuid(),
    entreprise_id uuid not null references public.entreprises(id) on delete cascade,
    utilisateur_id uuid not null references public.profils(id) on delete cascade,
    role text not null default 'membre' check (role in ('admin', 'membre')),
    rejoint_le timestamptz default now(),
    unique (entreprise_id, utilisateur_id)
);

-- ================================
-- AJOUT DE LA CLÉ ÉTRANGÈRE
-- profils.entreprise_active_id -> entreprises.id
-- ================================
alter table public.profils
drop constraint if exists profils_entreprise_active_id_fkey;

alter table public.profils
add constraint profils_entreprise_active_id_fkey
foreign key (entreprise_active_id)
references public.entreprises(id)
on delete set null;


-- ================================
-- PARTIE 2
-- ================================

-- ================================
-- ACTIVER RLS
-- ================================
alter table public.profils enable row level security;
alter table public.entreprises enable row level security;
alter table public.membres_entreprise enable row level security;

-- ================================
-- POLICIES : profils
-- ================================

-- Lire son propre profil
create policy "profils_lire_son_profil"
on public.profils
for select
to authenticated
using (auth.uid() = id);

-- Créer son propre profil
create policy "profils_creer_son_profil"
on public.profils
for insert
to authenticated
with check (auth.uid() = id);

-- Modifier son propre profil
create policy "profils_modifier_son_profil"
on public.profils
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- ================================
-- POLICIES : entreprises
-- ================================

-- Lire les entreprises dont je suis membre
create policy "entreprises_lire_si_membre"
on public.entreprises
for select
to authenticated
using (
    exists (
        select 1
        from public.membres_entreprise me
        where me.entreprise_id = entreprises.id
        and me.utilisateur_id = auth.uid()
    )
);

-- Créer une entreprise si je suis connecté
create policy "entreprises_creer_si_connecte"
on public.entreprises
for insert
to authenticated
with check (auth.uid() = cree_par);

-- Modifier une entreprise si je suis admin
create policy "entreprises_modifier_si_admin"
on public.entreprises
for update
to authenticated
using (
    exists (
        select 1
        from public.membres_entreprise me
        where me.entreprise_id = entreprises.id
        and me.utilisateur_id = auth.uid()
        and me.role = 'admin'
    )
)
with check (
    exists (
        select 1
        from public.membres_entreprise me
        where me.entreprise_id = entreprises.id
        and me.utilisateur_id = auth.uid()
        and me.role = 'admin'
    )
);

-- ================================
-- POLICIES : membres_entreprise
-- ================================

-- Lire les membres de mon entreprise
create policy "membres_lire_si_meme_entreprise"
on public.membres_entreprise
for select
to authenticated
using (
    exists (
        select 1
        from public.membres_entreprise me
        where me.entreprise_id = membres_entreprise.entreprise_id
        and me.utilisateur_id = auth.uid()
    )
);

-- Se lier soi-même à une entreprise
create policy "membres_creer_pour_soi"
on public.membres_entreprise
for insert
to authenticated
with check (auth.uid() = utilisateur_id);

-- Modifier les membres si admin
create policy "membres_modifier_si_admin"
on public.membres_entreprise
for update
to authenticated
using (
    exists (
        select 1
        from public.membres_entreprise me
        where me.entreprise_id = membres_entreprise.entreprise_id
        and me.utilisateur_id = auth.uid()
        and me.role = 'admin'
    )
)
with check (
    exists (
        select 1
        from public.membres_entreprise me
        where me.entreprise_id = membres_entreprise.entreprise_id
        and me.utilisateur_id = auth.uid()
        and me.role = 'admin'
    )
);


-- ================================
-- PARTIE 3 - CORRECTION QUI N'A PAS MARCHER
-- ================================

/*
-- =========================================
-- STORAGE POLICIES POUR logos-entreprises
-- =========================================

-- Autoriser les utilisateurs connectés à uploader
create policy "logos_upload_auth"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'logos-entreprises');

-- Autoriser lecture publique des logos
create policy "logos_public_read"
on storage.objects
for select
to public
using (bucket_id = 'logos-entreprises');

-- Autoriser l'utilisateur à supprimer ses propres logos
create policy "logos_delete_auth"
on storage.objects
for delete
to authenticated
using (bucket_id = 'logos-entreprises');

-- Autoriser l'utilisateur connecté à mettre à jour
create policy "logos_update_auth"
on storage.objects
for update
to authenticated
using (bucket_id = 'logos-entreprises')
with check (bucket_id = 'logos-entreprises');
*/


-- ================================
-- PARTIE 4 - CORRECTION QUI N'A PAS MARCHER
-- ================================

/*
drop policy if exists "entreprises_lire_si_membre" on public.entreprises;

create policy "entreprises_lire_si_membre_ou_createur"
on public.entreprises
for select
to authenticated
using (
    cree_par = auth.uid()
    or exists (
        select 1
        from public.membres_entreprise me
        where me.entreprise_id = entreprises.id
        and me.utilisateur_id = auth.uid()
    )
);
*/


-- ================================
-- PARTIE 5 - CORRECTION QUI A MARCHER
-- ================================

-- =========================================
-- FONCTION : créer une entreprise proprement
-- =========================================

create or replace function public.creer_entreprise_complete(
    p_nom text,
    p_description text,
    p_devise text,
    p_theme text,
    p_logo_url text
)
returns public.entreprises
language plpgsql
security definer
set search_path = public
as $$
declare
    v_utilisateur_id uuid;
    v_entreprise public.entreprises;
begin
    -- Vérifier utilisateur connecté
    v_utilisateur_id := auth.uid();

    if v_utilisateur_id is null then
        raise exception 'Utilisateur non connecté';
    end if;

    -- Vérifier que le profil existe
    if not exists (
        select 1
        from public.profils
        where id = v_utilisateur_id
    ) then
        raise exception 'Profil utilisateur introuvable';
    end if;

    -- 1) Créer entreprise
    insert into public.entreprises (
        nom,
        description,
        devise,
        theme,
        logo_url,
        cree_par
    )
    values (
        p_nom,
        p_description,
        coalesce(nullif(trim(p_devise), ''), 'USD'),
        coalesce(nullif(trim(p_theme), ''), '#2d3436'),
        p_logo_url,
        v_utilisateur_id
    )
    returning * into v_entreprise;

    -- 2) Ajouter le créateur comme admin
    insert into public.membres_entreprise (
        entreprise_id,
        utilisateur_id,
        role
    )
    values (
        v_entreprise.id,
        v_utilisateur_id,
        'admin'
    );

    -- 3) Définir entreprise active dans profil
    update public.profils
    set entreprise_active_id = v_entreprise.id
    where id = v_utilisateur_id;

    -- 4) Retourner l’entreprise
    return v_entreprise;
end;
$$;

-- ================================
-- PARTIE 6 - CORRECTION QUI A MARCHER
-- ================================

grant execute on function public.creer_entreprise_complete(
    text,
    text,
    text,
    text,
    text
) to authenticated;

-- ================================
-- PARTIE 7 - IL Y AURA UNE ERREUR LORS DE CETTE CORRECTION
-- ================================

/*
-- =========================================
-- NETTOYAGE DES ANCIENNES POLICIES STORAGE
-- =========================================

drop policy if exists "logos_upload_auth" on storage.objects;
drop policy if exists "logos_public_read" on storage.objects;
drop policy if exists "logos_delete_auth" on storage.objects;
drop policy if exists "logos_update_auth" on storage.objects;

-- =========================================
-- NOUVELLES POLICIES STORAGE PROPRES
-- Bucket : logos-entreprises
-- =========================================

-- Upload : utilisateur connecté peut uploader uniquement dans son dossier
create policy "logos_upload_utilisateur_dossier"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'logos-entreprises'
    and (storage.foldername(name))[1] = auth.uid()::text
);

-- Lecture publique
create policy "logos_public_read"
on storage.objects
for select
to public
using (
    bucket_id = 'logos-entreprises'
);

-- Suppression : seulement ses propres fichiers
create policy "logos_delete_utilisateur"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'logos-entreprises'
    and owner_id = auth.uid()
);

-- Mise à jour : seulement ses propres fichiers
create policy "logos_update_utilisateur"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'logos-entreprises'
    and owner_id = auth.uid()
)
with check (
    bucket_id = 'logos-entreprises'
    and owner_id = auth.uid()
);
*/

-- ================================
-- PARTIE 8 - CORRECTION DE L'ERREUR DE LA PARTIE 7
-- ================================

-- =========================================
-- NETTOYAGE DES POLICIES STORAGE
-- =========================================

drop policy if exists "logos_upload_auth" on storage.objects;
drop policy if exists "logos_public_read" on storage.objects;
drop policy if exists "logos_delete_auth" on storage.objects;
drop policy if exists "logos_update_auth" on storage.objects;

drop policy if exists "logos_upload_utilisateur_dossier" on storage.objects;
drop policy if exists "logos_delete_utilisateur" on storage.objects;
drop policy if exists "logos_update_utilisateur" on storage.objects;

-- =========================================
-- NOUVELLES POLICIES STORAGE CORRIGÉES
-- Bucket : logos-entreprises
-- =========================================

-- Upload : utilisateur connecté peut uploader uniquement dans son propre dossier
create policy "logos_upload_utilisateur_dossier"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'logos-entreprises'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- Lecture publique
create policy "logos_public_read"
on storage.objects
for select
to public
using (
    bucket_id = 'logos-entreprises'
);

-- Suppression : seulement ses propres fichiers
create policy "logos_delete_utilisateur"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'logos-entreprises'
    and owner_id = (select auth.uid()::text)
);

-- Mise à jour : seulement ses propres fichiers
create policy "logos_update_utilisateur"
on storage.objects
for update
to authenticated
using (
    bucket_id = 'logos-entreprises'
    and owner_id = (select auth.uid()::text)
)
with check (
    bucket_id = 'logos-entreprises'
    and owner_id = (select auth.uid()::text)
);

-- ================================
-- PARTIE 9 - ENCORE UNE MODIFICATION
-- ================================

-- =========================================
-- FONCTION : récupérer le contexte utilisateur complet
-- =========================================

create or replace function public.recuperer_contexte_utilisateur()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_utilisateur_id uuid;
    v_profil public.profils;
    v_entreprise public.entreprises;
begin
    v_utilisateur_id := auth.uid();

    if v_utilisateur_id is null then
        raise exception 'Utilisateur non connecté';
    end if;

    select *
    into v_profil
    from public.profils
    where id = v_utilisateur_id;

    if v_profil.entreprise_active_id is not null then
        select *
        into v_entreprise
        from public.entreprises
        where id = v_profil.entreprise_active_id;
    end if;

    return json_build_object(
        'profil', row_to_json(v_profil),
        'entreprise', row_to_json(v_entreprise)
    );
end;
$$;

-- ================================
-- PARTIE 10 - ENCORE UNE MODIFICATION
-- ================================

grant execute on function public.recuperer_contexte_utilisateur()
to authenticated;

-- ================================
-- PARTIE 11 - AUTRES AJUSTEMENTS
-- ================================

drop policy if exists "entreprises_lire_si_membre" on public.entreprises;
drop policy if exists "entreprises_lire_si_membre_ou_createur" on public.entreprises;

create policy "entreprises_lire_si_membre_ou_createur"
on public.entreprises
for select
to authenticated
using (
    cree_par = auth.uid()
    or exists (
        select 1
        from public.membres_entreprise me
        where me.entreprise_id = entreprises.id
        and me.utilisateur_id = auth.uid()
    )
);