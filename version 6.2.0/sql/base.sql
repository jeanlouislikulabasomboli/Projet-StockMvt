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

-- ================================
-- PARTIE 12 - AUTRES EXCUTIONS
-- ================================
-- =========================================
-- FONCTION : modifier une entreprise proprement
-- =========================================

create or replace function public.modifier_entreprise_complete(
    p_entreprise_id uuid,
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

    -- Vérifier que l'utilisateur est admin de l'entreprise
    if not exists (
        select 1
        from public.membres_entreprise me
        where me.entreprise_id = p_entreprise_id
        and me.utilisateur_id = v_utilisateur_id
        and me.role = 'admin'
    ) then
        raise exception 'Vous n''avez pas le droit de modifier cette entreprise';
    end if;

    -- Modifier l'entreprise
    update public.entreprises
    set
        nom = p_nom,
        description = p_description,
        devise = coalesce(nullif(trim(p_devise), ''), 'USD'),
        theme = coalesce(nullif(trim(p_theme), ''), '#2d3436'),
        logo_url = p_logo_url
    where id = p_entreprise_id
    returning * into v_entreprise;

    if v_entreprise.id is null then
        raise exception 'Entreprise introuvable';
    end if;

    return v_entreprise;
end;
$$;

-- ================================
-- PARTIE 13 - AUTRES EXCUTIONS
-- ================================
grant execute on function public.modifier_entreprise_complete(
    uuid,
    text,
    text,
    text,
    text,
    text
) to authenticated;

-- ================================
-- PARTIE 14 - AUTRES EXCUTIONS
-- ================================
create or replace function public.recuperer_entreprises_utilisateur()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
    v_utilisateur_id uuid;
    v_resultat json;
begin
    v_utilisateur_id := auth.uid();

    if v_utilisateur_id is null then
        raise exception 'Utilisateur non connecté';
    end if;

    select coalesce(
        json_agg(
            json_build_object(
                'id', e.id,
                'nom', e.nom,
                'description', e.description,
                'devise', e.devise,
                'theme', e.theme,
                'logo_url', e.logo_url,
                'cree_par', e.cree_par,
                'cree_le', e.cree_le,
                'role', me.role
            )
            order by e.cree_le desc
        ),
        '[]'::json
    )
    into v_resultat
    from public.membres_entreprise me
    join public.entreprises e on e.id = me.entreprise_id
    where me.utilisateur_id = v_utilisateur_id;

    return v_resultat;
end;
$$;

-- ================================
-- PARTIE 15 - AUTRES EXCUTIONS
-- ================================
grant execute on function public.recuperer_entreprises_utilisateur()
to authenticated;

-- ================================
-- PARTIE 16 - MIGRATION DES RÔLES + INVITATIONS
-- ================================

-- 1) D'abord supprimer l'ancienne contrainte
ALTER TABLE public.membres_entreprise
DROP CONSTRAINT IF EXISTS membres_entreprise_role_check;

-- 2) Migrer les anciens rôles AVANT de poser la nouvelle contrainte
UPDATE public.membres_entreprise
SET role = 'administrateur'
WHERE role = 'admin';

UPDATE public.membres_entreprise
SET role = 'operateur'
WHERE role = 'membre';

-- 3) Maintenant que toutes les lignes sont conformes, ajouter la nouvelle contrainte
ALTER TABLE public.membres_entreprise
ADD CONSTRAINT membres_entreprise_role_check
CHECK (role IN ('administrateur', 'editeur', 'coordinateur', 'auditeur', 'operateur'));

-- 4) Créer la table des invitations
CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id uuid NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('administrateur', 'editeur', 'coordinateur', 'auditeur', 'operateur')),
    token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    cree_par uuid NOT NULL REFERENCES public.profils(id) ON DELETE CASCADE,
    utilise_par uuid REFERENCES public.profils(id) ON DELETE SET NULL,
    utilise_le timestamptz,
    expire_le timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
    cree_le timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);

-- 5) Activer RLS sur invitations
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Lire les invitations de mes entreprises (si admin)
CREATE POLICY "invitations_lire_si_admin"
ON public.invitations
FOR SELECT
TO authenticated
USING (
    cree_par = auth.uid()
    OR utilise_par = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = invitations.entreprise_id
        AND me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
);

-- Créer des invitations si admin de l'entreprise
CREATE POLICY "invitations_creer_si_admin"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = cree_par
    AND EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = invitations.entreprise_id
        AND me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
);

-- 6) Fonction : créer une invitation et retourner le token
CREATE OR REPLACE FUNCTION public.creer_invitation(
    p_entreprise_id uuid,
    p_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_invitation public.invitations;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
        AND me.role = 'administrateur'
    ) THEN
        RAISE EXCEPTION 'Seuls les administrateurs peuvent inviter des membres';
    END IF;

    IF p_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'auditeur', 'operateur') THEN
        RAISE EXCEPTION 'Rôle invalide : %', p_role;
    END IF;

    INSERT INTO public.invitations (
        entreprise_id,
        role,
        cree_par
    )
    VALUES (
        p_entreprise_id,
        p_role,
        v_utilisateur_id
    )
    RETURNING * INTO v_invitation;

    RETURN json_build_object(
        'id', v_invitation.id,
        'token', v_invitation.token,
        'role', v_invitation.role,
        'entreprise_id', v_invitation.entreprise_id,
        'expire_le', v_invitation.expire_le
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.creer_invitation(uuid, text) TO authenticated;

-- 7) Fonction : utiliser une invitation (rejoindre une entreprise)
CREATE OR REPLACE FUNCTION public.utiliser_invitation(
    p_token text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_invitation public.invitations;
    v_entreprise public.entreprises;
    v_nom_utilisateur text;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    SELECT * INTO v_invitation
    FROM public.invitations
    WHERE token = p_token;

    IF v_invitation.id IS NULL THEN
        RAISE EXCEPTION 'Invitation introuvable ou invalide';
    END IF;

    IF v_invitation.utilise_par IS NOT NULL THEN
        RAISE EXCEPTION 'Cette invitation a déjà été utilisée';
    END IF;

    IF v_invitation.expire_le < now() THEN
        RAISE EXCEPTION 'Cette invitation a expiré';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = v_invitation.entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
    ) THEN
        RAISE EXCEPTION 'Vous êtes déjà membre de cette entreprise';
    END IF;

    INSERT INTO public.membres_entreprise (
        entreprise_id,
        utilisateur_id,
        role
    )
    VALUES (
        v_invitation.entreprise_id,
        v_utilisateur_id,
        v_invitation.role
    );

    UPDATE public.invitations
    SET utilise_par = v_utilisateur_id,
        utilise_le = now()
    WHERE id = v_invitation.id;

    UPDATE public.profils
    SET entreprise_active_id = v_invitation.entreprise_id
    WHERE id = v_utilisateur_id;

    SELECT * INTO v_entreprise
    FROM public.entreprises
    WHERE id = v_invitation.entreprise_id;

    SELECT nom_complet INTO v_nom_utilisateur
    FROM public.profils
    WHERE id = v_utilisateur_id;

    RETURN json_build_object(
        'succes', true,
        'entreprise_id', v_entreprise.id,
        'entreprise_nom', v_entreprise.nom,
        'role', v_invitation.role,
        'utilisateur_nom', v_nom_utilisateur
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.utiliser_invitation(text) TO authenticated;

-- 8) Mettre à jour creer_entreprise_complete avec le nouveau rôle
CREATE OR REPLACE FUNCTION public.creer_entreprise_complete(
    p_nom text,
    p_description text,
    p_devise text,
    p_theme text,
    p_logo_url text
)
RETURNS public.entreprises
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_entreprise public.entreprises;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.profils
        WHERE id = v_utilisateur_id
    ) THEN
        RAISE EXCEPTION 'Profil utilisateur introuvable';
    END IF;

    INSERT INTO public.entreprises (
        nom, description, devise, theme, logo_url, cree_par
    )
    VALUES (
        p_nom,
        p_description,
        coalesce(nullif(trim(p_devise), ''), 'USD'),
        coalesce(nullif(trim(p_theme), ''), '#2d3436'),
        p_logo_url,
        v_utilisateur_id
    )
    RETURNING * INTO v_entreprise;

    INSERT INTO public.membres_entreprise (
        entreprise_id, utilisateur_id, role
    )
    VALUES (
        v_entreprise.id, v_utilisateur_id, 'administrateur'
    );

    UPDATE public.profils
    SET entreprise_active_id = v_entreprise.id
    WHERE id = v_utilisateur_id;

    RETURN v_entreprise;
END;
$$;

-- 9) Mettre à jour modifier_entreprise_complete avec le nouveau rôle
CREATE OR REPLACE FUNCTION public.modifier_entreprise_complete(
    p_entreprise_id uuid,
    p_nom text,
    p_description text,
    p_devise text,
    p_theme text,
    p_logo_url text
)
RETURNS public.entreprises
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_entreprise public.entreprises;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
        AND me.role = 'administrateur'
    ) THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit de modifier cette entreprise';
    END IF;

    UPDATE public.entreprises
    SET
        nom = p_nom,
        description = p_description,
        devise = coalesce(nullif(trim(p_devise), ''), 'USD'),
        theme = coalesce(nullif(trim(p_theme), ''), '#2d3436'),
        logo_url = p_logo_url
    WHERE id = p_entreprise_id
    RETURNING * INTO v_entreprise;

    IF v_entreprise.id IS NULL THEN
        RAISE EXCEPTION 'Entreprise introuvable';
    END IF;

    RETURN v_entreprise;
END;
$$;

-- 10) Mettre à jour recuperer_entreprises_utilisateur
CREATE OR REPLACE FUNCTION public.recuperer_entreprises_utilisateur()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_resultat json;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    SELECT coalesce(
        json_agg(
            json_build_object(
                'id', e.id,
                'nom', e.nom,
                'description', e.description,
                'devise', e.devise,
                'theme', e.theme,
                'logo_url', e.logo_url,
                'cree_par', e.cree_par,
                'cree_le', e.cree_le,
                'role', me.role
            )
            ORDER BY e.cree_le DESC
        ),
        '[]'::json
    )
    INTO v_resultat
    FROM public.membres_entreprise me
    JOIN public.entreprises e ON e.id = me.entreprise_id
    WHERE me.utilisateur_id = v_utilisateur_id;

    RETURN v_resultat;
END;
$$;

-- 11) Mettre à jour recuperer_contexte_utilisateur pour inclure le rôle
CREATE OR REPLACE FUNCTION public.recuperer_contexte_utilisateur()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_profil public.profils;
    v_entreprise public.entreprises;
    v_role text;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    SELECT * INTO v_profil
    FROM public.profils
    WHERE id = v_utilisateur_id;

    IF v_profil.entreprise_active_id IS NOT NULL THEN
        SELECT * INTO v_entreprise
        FROM public.entreprises
        WHERE id = v_profil.entreprise_active_id;

        SELECT me.role INTO v_role
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = v_profil.entreprise_active_id
        AND me.utilisateur_id = v_utilisateur_id;
    END IF;

    RETURN json_build_object(
        'profil', row_to_json(v_profil),
        'entreprise', row_to_json(v_entreprise),
        'role', v_role
    );
END;
$$;

-- 12) Fonction pour récupérer les membres d'une entreprise
CREATE OR REPLACE FUNCTION public.recuperer_membres_entreprise(
    p_entreprise_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_resultat json;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
    ) THEN
        RAISE EXCEPTION 'Vous n''êtes pas membre de cette entreprise';
    END IF;

    SELECT coalesce(
        json_agg(
            json_build_object(
                'id', p.id,
                'nom_complet', p.nom_complet,
                'email', p.email,
                'photo_url', p.photo_url,
                'role', me.role,
                'rejoint_le', me.rejoint_le
            )
            ORDER BY
                CASE me.role
                    WHEN 'administrateur' THEN 1
                    WHEN 'editeur' THEN 2
                    WHEN 'coordinateur' THEN 3
                    WHEN 'auditeur' THEN 4
                    WHEN 'operateur' THEN 5
                END,
                me.rejoint_le ASC
        ),
        '[]'::json
    )
    INTO v_resultat
    FROM public.membres_entreprise me
    JOIN public.profils p ON p.id = me.utilisateur_id
    WHERE me.entreprise_id = p_entreprise_id;

    RETURN v_resultat;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_membres_entreprise(uuid) TO authenticated;

-- 13) Fonction pour modifier le rôle d'un membre
CREATE OR REPLACE FUNCTION public.modifier_role_membre(
    p_entreprise_id uuid,
    p_membre_id uuid,
    p_nouveau_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_nb_admins integer;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
        AND me.role = 'administrateur'
    ) THEN
        RAISE EXCEPTION 'Seuls les administrateurs peuvent modifier les rôles';
    END IF;

    IF p_nouveau_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'auditeur', 'operateur') THEN
        RAISE EXCEPTION 'Rôle invalide : %', p_nouveau_role;
    END IF;

    IF p_nouveau_role != 'administrateur' THEN
        SELECT count(*) INTO v_nb_admins
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.role = 'administrateur'
        AND me.utilisateur_id != p_membre_id;

        IF v_nb_admins < 1 THEN
            RAISE EXCEPTION 'Il doit rester au moins un administrateur dans l''entreprise';
        END IF;
    END IF;

    UPDATE public.membres_entreprise
    SET role = p_nouveau_role
    WHERE entreprise_id = p_entreprise_id
    AND utilisateur_id = p_membre_id;

    RETURN json_build_object(
        'succes', true,
        'membre_id', p_membre_id,
        'nouveau_role', p_nouveau_role
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.modifier_role_membre(uuid, uuid, text) TO authenticated;

-- 14) Fonction pour retirer un membre
CREATE OR REPLACE FUNCTION public.retirer_membre_entreprise(
    p_entreprise_id uuid,
    p_membre_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_role_membre text;
    v_nb_admins integer;
    v_nom_membre text;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
        AND me.role = 'administrateur'
    ) THEN
        RAISE EXCEPTION 'Seuls les administrateurs peuvent retirer des membres';
    END IF;

    IF p_membre_id = v_utilisateur_id THEN
        RAISE EXCEPTION 'Utilisez la fonction quitter pour vous retirer vous-même';
    END IF;

    SELECT me.role INTO v_role_membre
    FROM public.membres_entreprise me
    WHERE me.entreprise_id = p_entreprise_id
    AND me.utilisateur_id = p_membre_id;

    IF v_role_membre IS NULL THEN
        RAISE EXCEPTION 'Ce membre n''appartient pas à cette entreprise';
    END IF;

    IF v_role_membre = 'administrateur' THEN
        SELECT count(*) INTO v_nb_admins
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.role = 'administrateur'
        AND me.utilisateur_id != p_membre_id;

        IF v_nb_admins < 1 THEN
            RAISE EXCEPTION 'Impossible de retirer le dernier administrateur';
        END IF;
    END IF;

    SELECT nom_complet INTO v_nom_membre
    FROM public.profils WHERE id = p_membre_id;

    DELETE FROM public.membres_entreprise
    WHERE entreprise_id = p_entreprise_id
    AND utilisateur_id = p_membre_id;

    UPDATE public.profils
    SET entreprise_active_id = NULL
    WHERE id = p_membre_id
    AND entreprise_active_id = p_entreprise_id;

    RETURN json_build_object(
        'succes', true,
        'membre_id', p_membre_id,
        'nom', v_nom_membre
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.retirer_membre_entreprise(uuid, uuid) TO authenticated;

-- 15) Fonction pour quitter une entreprise soi-même
CREATE OR REPLACE FUNCTION public.quitter_entreprise(
    p_entreprise_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
    v_role text;
    v_nb_admins integer;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    SELECT me.role INTO v_role
    FROM public.membres_entreprise me
    WHERE me.entreprise_id = p_entreprise_id
    AND me.utilisateur_id = v_utilisateur_id;

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'Vous n''êtes pas membre de cette entreprise';
    END IF;

    IF v_role = 'administrateur' THEN
        SELECT count(*) INTO v_nb_admins
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.role = 'administrateur'
        AND me.utilisateur_id != v_utilisateur_id;

        IF v_nb_admins < 1 THEN
            RAISE EXCEPTION 'Vous êtes le seul administrateur. Nommez un autre administrateur avant de quitter.';
        END IF;
    END IF;

    DELETE FROM public.membres_entreprise
    WHERE entreprise_id = p_entreprise_id
    AND utilisateur_id = v_utilisateur_id;

    UPDATE public.profils
    SET entreprise_active_id = NULL
    WHERE id = v_utilisateur_id
    AND entreprise_active_id = p_entreprise_id;

    RETURN json_build_object(
        'succes', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.quitter_entreprise(uuid) TO authenticated;

-- 16) Mettre à jour les policies qui référencent 'admin'
DROP POLICY IF EXISTS "entreprises_modifier_si_admin" ON public.entreprises;

CREATE POLICY "entreprises_modifier_si_admin"
ON public.entreprises
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = entreprises.id
        AND me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = entreprises.id
        AND me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
);

DROP POLICY IF EXISTS "membres_modifier_si_admin" ON public.membres_entreprise;

CREATE POLICY "membres_modifier_si_admin"
ON public.membres_entreprise
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = membres_entreprise.entreprise_id
        AND me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = membres_entreprise.entreprise_id
        AND me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
);

CREATE POLICY "membres_supprimer_si_admin_ou_soi"
ON public.membres_entreprise
FOR DELETE
TO authenticated
USING (
    utilisateur_id = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = membres_entreprise.entreprise_id
        AND me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
);

-- 17) Colonne verrouillée + fonction de verrouillage
ALTER TABLE public.entreprises
ADD COLUMN IF NOT EXISTS verrouillee boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.basculer_verrouillage_entreprise(
    p_entreprise_id uuid,
    p_verrouiller boolean
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
        AND me.role = 'administrateur'
    ) THEN
        RAISE EXCEPTION 'Seuls les administrateurs peuvent verrouiller l''entreprise';
    END IF;

    UPDATE public.entreprises
    SET verrouillee = p_verrouiller
    WHERE id = p_entreprise_id;

    RETURN json_build_object(
        'succes', true,
        'verrouillee', p_verrouiller
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.basculer_verrouillage_entreprise(uuid, boolean) TO authenticated;

-- ================================
-- PARTIE 17
-- ================================
-- ======================================================
-- TABLE : categories
-- ======================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    slug TEXT NOT NULL,
    cree_le TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entreprise_id, slug)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient les catégories de leur entreprise"
ON public.categories FOR SELECT
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me WHERE me.utilisateur_id = auth.uid()
    )
);

CREATE POLICY "Éditeurs et admins créent des catégories"
ON public.categories FOR INSERT
TO authenticated
WITH CHECK (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me
        WHERE me.utilisateur_id = auth.uid()
        AND me.role IN ('administrateur', 'editeur')
    )
);

CREATE POLICY "Éditeurs et admins modifient des catégories"
ON public.categories FOR UPDATE
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me
        WHERE me.utilisateur_id = auth.uid()
        AND me.role IN ('administrateur', 'editeur')
    )
);

CREATE POLICY "Admins suppriment des catégories"
ON public.categories FOR DELETE
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me
        WHERE me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
);

-- ======================================================
-- TABLE : produits
-- ======================================================
CREATE TABLE IF NOT EXISTS public.produits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    categorie_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    nom TEXT NOT NULL,
    code TEXT,
    code_barres TEXT,
    quantite_totale INTEGER DEFAULT 0,
    quantite_min INTEGER DEFAULT 0,
    quantite_max INTEGER DEFAULT 0,
    prix_achat NUMERIC(12,2) DEFAULT 0,
    prix_vente NUMERIC(12,2) DEFAULT 0,
    notes TEXT,
    photo_url TEXT,
    statut TEXT DEFAULT 'stock',
    cree_le TIMESTAMPTZ DEFAULT NOW(),
    modifie_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient les produits de leur entreprise"
ON public.produits FOR SELECT
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me WHERE me.utilisateur_id = auth.uid()
    )
);

CREATE POLICY "Éditeurs et admins créent des produits"
ON public.produits FOR INSERT
TO authenticated
WITH CHECK (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me
        WHERE me.utilisateur_id = auth.uid()
        AND me.role IN ('administrateur', 'editeur')
    )
);

CREATE POLICY "Éditeurs et admins modifient des produits"
ON public.produits FOR UPDATE
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me
        WHERE me.utilisateur_id = auth.uid()
        AND me.role IN ('administrateur', 'editeur')
    )
);

CREATE POLICY "Admins suppriment des produits"
ON public.produits FOR DELETE
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me
        WHERE me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
);

-- ======================================================
-- TABLE : emplacements_produit
-- ======================================================
CREATE TABLE IF NOT EXISTS public.emplacements_produit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    quantite INTEGER DEFAULT 0
);

ALTER TABLE public.emplacements_produit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient les emplacements via produit"
ON public.emplacements_produit FOR SELECT
TO authenticated
USING (
    produit_id IN (
        SELECT p.id FROM public.produits p WHERE p.entreprise_id IN (
            SELECT me.entreprise_id FROM public.membres_entreprise me WHERE me.utilisateur_id = auth.uid()
        )
    )
);

CREATE POLICY "Éditeurs et admins créent des emplacements"
ON public.emplacements_produit FOR INSERT
TO authenticated
WITH CHECK (
    produit_id IN (
        SELECT p.id FROM public.produits p WHERE p.entreprise_id IN (
            SELECT me.entreprise_id FROM public.membres_entreprise me
            WHERE me.utilisateur_id = auth.uid()
            AND me.role IN ('administrateur', 'editeur')
        )
    )
);

CREATE POLICY "Éditeurs et admins modifient des emplacements"
ON public.emplacements_produit FOR UPDATE
TO authenticated
USING (
    produit_id IN (
        SELECT p.id FROM public.produits p WHERE p.entreprise_id IN (
            SELECT me.entreprise_id FROM public.membres_entreprise me
            WHERE me.utilisateur_id = auth.uid()
            AND me.role IN ('administrateur', 'editeur')
        )
    )
);

CREATE POLICY "Admins suppriment des emplacements"
ON public.emplacements_produit FOR DELETE
TO authenticated
USING (
    produit_id IN (
        SELECT p.id FROM public.produits p WHERE p.entreprise_id IN (
            SELECT me.entreprise_id FROM public.membres_entreprise me
            WHERE me.utilisateur_id = auth.uid()
            AND me.role = 'administrateur'
        )
    )
);

-- ======================================================
-- INDEX pour performance
-- ======================================================
CREATE INDEX IF NOT EXISTS idx_produits_entreprise ON public.produits(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON public.produits(categorie_id);
CREATE INDEX IF NOT EXISTS idx_categories_entreprise ON public.categories(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_emplacements_produit ON public.emplacements_produit(produit_id);

-- ======================================================
-- STORAGE BUCKET : photos-produits
-- ======================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos-produits', 'photos-produits', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "photos_produits_upload_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'photos-produits'
);

CREATE POLICY "photos_produits_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'photos-produits');

CREATE POLICY "photos_produits_delete_auth"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'photos-produits'
);

-- ======================================================
-- FONCTION RPC : creer_categorie
-- ======================================================
CREATE OR REPLACE FUNCTION public.creer_categorie(
    p_entreprise_id UUID,
    p_nom TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_slug TEXT;
    v_categorie public.categories%ROWTYPE;
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
        AND me.role IN ('administrateur', 'editeur')
    ) THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit de créer des catégories dans cette entreprise';
    END IF;

    -- Générer le slug
    v_slug := lower(trim(p_nom));
    v_slug := translate(v_slug, 'àâäéèêëïîôùûüÿçñ', 'aaaeeeeiioouuyçn');
    v_slug := regexp_replace(v_slug, '[^a-z0-9]+', '-', 'g');
    v_slug := trim(both '-' from v_slug);

    -- Vérifier doublon
    IF EXISTS (
        SELECT 1 FROM public.categories
        WHERE entreprise_id = p_entreprise_id AND slug = v_slug
    ) THEN
        RAISE EXCEPTION 'Une catégorie avec ce nom existe déjà.';
    END IF;

    INSERT INTO public.categories (entreprise_id, nom, slug)
    VALUES (p_entreprise_id, trim(p_nom), v_slug)
    RETURNING * INTO v_categorie;

    RETURN row_to_json(v_categorie);
END;
$$;

GRANT EXECUTE ON FUNCTION public.creer_categorie(UUID, TEXT) TO authenticated;

-- ======================================================
-- FONCTION RPC : recuperer_categories_entreprise
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_categories_entreprise(
    p_entreprise_id UUID
)
RETURNS SETOF public.categories
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
    ) THEN
        RAISE EXCEPTION 'Vous n''êtes pas membre de cette entreprise';
    END IF;

    RETURN QUERY
    SELECT * FROM public.categories
    WHERE entreprise_id = p_entreprise_id
    ORDER BY nom ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_categories_entreprise(UUID) TO authenticated;

-- ======================================================
-- FONCTION RPC : enregistrer_produit
-- ======================================================
CREATE OR REPLACE FUNCTION public.enregistrer_produit(
    p_entreprise_id UUID,
    p_nom TEXT,
    p_code TEXT DEFAULT NULL,
    p_code_barres TEXT DEFAULT NULL,
    p_categorie_id UUID DEFAULT NULL,
    p_quantite_totale INTEGER DEFAULT 0,
    p_quantite_min INTEGER DEFAULT 0,
    p_quantite_max INTEGER DEFAULT 0,
    p_prix_achat NUMERIC DEFAULT 0,
    p_prix_vente NUMERIC DEFAULT 0,
    p_notes TEXT DEFAULT NULL,
    p_photo_url TEXT DEFAULT NULL,
    p_emplacements JSON DEFAULT '[]'::JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_produit public.produits%ROWTYPE;
    v_statut TEXT;
    v_emplacement JSON;
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
        AND me.role IN ('administrateur', 'editeur')
    ) THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit de créer des produits dans cette entreprise';
    END IF;

    -- Calculer le statut
    IF p_quantite_totale <= 0 THEN
        v_statut := 'rupture';
    ELSIF p_quantite_min > 0 AND p_quantite_totale < p_quantite_min THEN
        v_statut := 'faible';
    ELSIF p_quantite_max > 0 AND p_quantite_totale > p_quantite_max THEN
        v_statut := 'surstock';
    ELSE
        v_statut := 'stock';
    END IF;

    -- Insérer le produit
    INSERT INTO public.produits (
        entreprise_id, nom, code, code_barres, categorie_id,
        quantite_totale, quantite_min, quantite_max,
        prix_achat, prix_vente, notes, photo_url, statut
    )
    VALUES (
        p_entreprise_id, trim(p_nom), nullif(trim(p_code), ''), nullif(trim(p_code_barres), ''),
        p_categorie_id,
        p_quantite_totale, p_quantite_min, p_quantite_max,
        p_prix_achat, p_prix_vente,
        nullif(trim(p_notes), ''), p_photo_url, v_statut
    )
    RETURNING * INTO v_produit;

    -- Insérer les emplacements
    FOR v_emplacement IN SELECT * FROM json_array_elements(p_emplacements)
    LOOP
        INSERT INTO public.emplacements_produit (produit_id, nom, quantite)
        VALUES (
            v_produit.id,
            trim((v_emplacement->>'nom')::TEXT),
            COALESCE((v_emplacement->>'quantite')::INTEGER, 0)
        );
    END LOOP;

    RETURN row_to_json(v_produit);
END;
$$;

GRANT EXECUTE ON FUNCTION public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON) TO authenticated;

-- ======================================================
-- FONCTION RPC : recuperer_produits_entreprise
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_produits_entreprise(
    p_entreprise_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultat JSON;
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
    ) THEN
        RAISE EXCEPTION 'Vous n''êtes pas membre de cette entreprise';
    END IF;

    SELECT json_agg(ligne ORDER BY ligne->>'nom')
    INTO v_resultat
    FROM (
        SELECT json_build_object(
            'id', p.id,
            'nom', p.nom,
            'code', p.code,
            'code_barres', p.code_barres,
            'categorie_id', p.categorie_id,
            'categorie_nom', COALESCE(c.nom, 'Sans catégorie'),
            'quantite_totale', p.quantite_totale,
            'quantite_min', p.quantite_min,
            'quantite_max', p.quantite_max,
            'prix_achat', p.prix_achat,
            'prix_vente', p.prix_vente,
            'notes', p.notes,
            'photo_url', p.photo_url,
            'statut', p.statut,
            'cree_le', p.cree_le,
            'modifie_le', p.modifie_le,
            'emplacements', COALESCE(
                (
                    SELECT json_agg(json_build_object(
                        'id', ep.id,
                        'nom', ep.nom,
                        'quantite', ep.quantite
                    ))
                    FROM public.emplacements_produit ep
                    WHERE ep.produit_id = p.id
                ),
                '[]'::JSON
            )
        ) AS ligne
        FROM public.produits p
        LEFT JOIN public.categories c ON c.id = p.categorie_id
        WHERE p.entreprise_id = p_entreprise_id
    ) sous_requete;

    RETURN COALESCE(v_resultat, '[]'::JSON);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_produits_entreprise(UUID) TO authenticated;

-- ======================================================
-- FONCTION RPC : recuperer_details_produit
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_details_produit(
    p_produit_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultat JSON;
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    -- Vérifier que l'utilisateur est membre de l'entreprise du produit
    IF NOT EXISTS (
        SELECT 1 FROM public.produits p
        JOIN public.membres_entreprise me ON me.entreprise_id = p.entreprise_id
        WHERE p.id = p_produit_id
        AND me.utilisateur_id = v_utilisateur_id
    ) THEN
        RAISE EXCEPTION 'Vous n''avez pas accès à ce produit';
    END IF;

    SELECT json_build_object(
        'id', p.id,
        'nom', p.nom,
        'code', p.code,
        'code_barres', p.code_barres,
        'categorie_id', p.categorie_id,
        'categorie_nom', COALESCE(c.nom, 'Sans catégorie'),
        'quantite_totale', p.quantite_totale,
        'quantite_min', p.quantite_min,
        'quantite_max', p.quantite_max,
        'prix_achat', p.prix_achat,
        'prix_vente', p.prix_vente,
        'notes', p.notes,
        'photo_url', p.photo_url,
        'statut', p.statut,
        'cree_le', p.cree_le,
        'modifie_le', p.modifie_le,
        'emplacements', COALESCE(
            (
                SELECT json_agg(json_build_object(
                    'id', ep.id,
                    'nom', ep.nom,
                    'quantite', ep.quantite
                ))
                FROM public.emplacements_produit ep
                WHERE ep.produit_id = p.id
            ),
            '[]'::JSON
        )
    )
    INTO v_resultat
    FROM public.produits p
    LEFT JOIN public.categories c ON c.id = p.categorie_id
    WHERE p.id = p_produit_id;

    RETURN v_resultat;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_details_produit(UUID) TO authenticated;

-- ======================================================
-- FONCTION RPC : supprimer_produit
-- ======================================================
CREATE OR REPLACE FUNCTION public.supprimer_produit(
    p_produit_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    -- Vérifier que l'utilisateur est admin de l'entreprise du produit
    IF NOT EXISTS (
        SELECT 1 FROM public.produits p
        JOIN public.membres_entreprise me ON me.entreprise_id = p.entreprise_id
        WHERE p.id = p_produit_id
        AND me.utilisateur_id = v_utilisateur_id
        AND me.role = 'administrateur'
    ) THEN
        RAISE EXCEPTION 'Seuls les administrateurs peuvent supprimer des produits';
    END IF;

    DELETE FROM public.produits WHERE id = p_produit_id;
    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.supprimer_produit(UUID) TO authenticated;

-- ======================================================
-- FONCTION RPC : generer_code_produit
-- ======================================================
CREATE OR REPLACE FUNCTION public.generer_code_produit(
    p_entreprise_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_compteur INTEGER;
    v_code TEXT;
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
    ) THEN
        RAISE EXCEPTION 'Vous n''êtes pas membre de cette entreprise';
    END IF;

    SELECT COUNT(*) + 1 INTO v_compteur
    FROM public.produits
    WHERE entreprise_id = p_entreprise_id;

    v_code := 'PRD-' || LPAD(v_compteur::TEXT, 3, '0');

    -- Vérifier unicité, incrémenter si nécessaire
    WHILE EXISTS (
        SELECT 1 FROM public.produits
        WHERE entreprise_id = p_entreprise_id AND code = v_code
    ) LOOP
        v_compteur := v_compteur + 1;
        v_code := 'PRD-' || LPAD(v_compteur::TEXT, 3, '0');
    END LOOP;

    RETURN v_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generer_code_produit(UUID) TO authenticated;

-- ================================
-- PARTIE 18
-- ================================
-- Supprimer toutes les versions existantes de la fonction
DROP FUNCTION IF EXISTS public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON);
DROP FUNCTION IF EXISTS public.enregistrer_produit;

-- Recréer proprement
CREATE OR REPLACE FUNCTION public.enregistrer_produit(
    p_entreprise_id UUID,
    p_nom TEXT,
    p_code TEXT DEFAULT NULL,
    p_code_barres TEXT DEFAULT NULL,
    p_categorie_id UUID DEFAULT NULL,
    p_quantite_totale INTEGER DEFAULT 0,
    p_quantite_min INTEGER DEFAULT 0,
    p_quantite_max INTEGER DEFAULT 0,
    p_prix_achat NUMERIC DEFAULT 0,
    p_prix_vente NUMERIC DEFAULT 0,
    p_notes TEXT DEFAULT NULL,
    p_photo_url TEXT DEFAULT NULL,
    p_emplacements JSON DEFAULT '[]'::JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_produit public.produits%ROWTYPE;
    v_statut TEXT;
    v_emplacement JSON;
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.membres_entreprise me
        WHERE me.entreprise_id = p_entreprise_id
        AND me.utilisateur_id = v_utilisateur_id
        AND me.role IN ('administrateur', 'editeur')
    ) THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit de créer des produits dans cette entreprise';
    END IF;

    -- Calculer le statut
    IF p_quantite_totale <= 0 THEN
        v_statut := 'rupture';
    ELSIF p_quantite_min > 0 AND p_quantite_totale < p_quantite_min THEN
        v_statut := 'faible';
    ELSIF p_quantite_max > 0 AND p_quantite_totale > p_quantite_max THEN
        v_statut := 'surstock';
    ELSE
        v_statut := 'stock';
    END IF;

    -- Insérer le produit
    INSERT INTO public.produits (
        entreprise_id, nom, code, code_barres, categorie_id,
        quantite_totale, quantite_min, quantite_max,
        prix_achat, prix_vente, notes, photo_url, statut
    )
    VALUES (
        p_entreprise_id, trim(p_nom), nullif(trim(COALESCE(p_code, '')), ''), nullif(trim(COALESCE(p_code_barres, '')), ''),
        p_categorie_id,
        COALESCE(p_quantite_totale, 0), COALESCE(p_quantite_min, 0), COALESCE(p_quantite_max, 0),
        COALESCE(p_prix_achat, 0), COALESCE(p_prix_vente, 0),
        nullif(trim(COALESCE(p_notes, '')), ''), p_photo_url, v_statut
    )
    RETURNING * INTO v_produit;

    -- Insérer les emplacements
    IF p_emplacements IS NOT NULL THEN
        FOR v_emplacement IN SELECT * FROM json_array_elements(p_emplacements)
        LOOP
            INSERT INTO public.emplacements_produit (produit_id, nom, quantite)
            VALUES (
                v_produit.id,
                trim(COALESCE((v_emplacement->>'nom')::TEXT, '')),
                COALESCE((v_emplacement->>'quantite')::INTEGER, 0)
            );
        END LOOP;
    END IF;

    RETURN row_to_json(v_produit);
END;
$$;

GRANT EXECUTE ON FUNCTION public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON) TO authenticated;
