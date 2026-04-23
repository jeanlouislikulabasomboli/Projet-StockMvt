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

-- ================================
-- PARTIE 19 — MOUVEMENTS DE STOCK
-- ================================

-- ======================================================
-- TABLE : mouvements_stock
-- ======================================================
CREATE TABLE IF NOT EXISTS public.mouvements_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
    emplacement_id UUID NOT NULL REFERENCES public.emplacements_produit(id) ON DELETE CASCADE,
    type_mouvement TEXT NOT NULL CHECK (type_mouvement IN ('entree', 'sortie', 'inventaire')),
    motif TEXT,
    quantite INTEGER NOT NULL,
    stock_avant_global INTEGER NOT NULL,
    stock_apres_global INTEGER NOT NULL,
    stock_avant_emplacement INTEGER NOT NULL,
    stock_apres_emplacement INTEGER NOT NULL,
    note TEXT,
    utilisateur_id UUID NOT NULL REFERENCES auth.users(id),
    utilisateur_nom TEXT,
    produit_nom TEXT,
    emplacement_nom TEXT,
    cree_le TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.mouvements_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient les mouvements de leur entreprise"
ON public.mouvements_stock FOR SELECT
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me WHERE me.utilisateur_id = auth.uid()
    )
);

CREATE POLICY "Membres autorisés créent des mouvements"
ON public.mouvements_stock FOR INSERT
TO authenticated
WITH CHECK (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me
        WHERE me.utilisateur_id = auth.uid()
        AND me.role IN ('administrateur', 'editeur', 'coordinateur', 'auditeur', 'operateur')
    )
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_mouvements_entreprise ON public.mouvements_stock(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_produit ON public.mouvements_stock(produit_id);
CREATE INDEX IF NOT EXISTS idx_mouvements_date ON public.mouvements_stock(cree_le DESC);
CREATE INDEX IF NOT EXISTS idx_mouvements_type ON public.mouvements_stock(type_mouvement);

-- ======================================================
-- FONCTION RPC : effectuer_mouvement_stock
-- ======================================================
CREATE OR REPLACE FUNCTION public.effectuer_mouvement_stock(
    p_produit_id UUID,
    p_emplacement_id UUID,
    p_type_mouvement TEXT,
    p_motif TEXT,
    p_quantite INTEGER,
    p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id UUID;
    v_utilisateur_nom TEXT;
    v_produit public.produits%ROWTYPE;
    v_emplacement public.emplacements_produit%ROWTYPE;
    v_stock_avant_global INTEGER;
    v_stock_apres_global INTEGER;
    v_stock_avant_emplacement INTEGER;
    v_stock_apres_emplacement INTEGER;
    v_difference INTEGER;
    v_nouveau_statut TEXT;
    v_mouvement public.mouvements_stock%ROWTYPE;
    v_role TEXT;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    -- Récupérer le produit
    SELECT * INTO v_produit FROM public.produits WHERE id = p_produit_id;
    IF v_produit IS NULL THEN
        RAISE EXCEPTION 'Produit introuvable';
    END IF;

    -- Vérifier le rôle
    SELECT me.role INTO v_role
    FROM public.membres_entreprise me
    WHERE me.entreprise_id = v_produit.entreprise_id
    AND me.utilisateur_id = v_utilisateur_id;

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'Vous n''êtes pas membre de cette entreprise';
    END IF;

    -- Vérifier permissions selon type
    IF p_type_mouvement = 'entree' AND v_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'operateur') THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit d''effectuer une entrée de stock';
    END IF;

    IF p_type_mouvement = 'sortie' AND v_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'operateur') THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit d''effectuer une sortie de stock';
    END IF;

    IF p_type_mouvement = 'inventaire' AND v_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'auditeur') THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit d''effectuer un inventaire';
    END IF;

    -- Récupérer l'emplacement
    SELECT * INTO v_emplacement FROM public.emplacements_produit WHERE id = p_emplacement_id AND produit_id = p_produit_id;
    IF v_emplacement IS NULL THEN
        RAISE EXCEPTION 'Emplacement introuvable pour ce produit';
    END IF;

    -- Récupérer le nom de l'utilisateur
    SELECT COALESCE(p.nom_complet, u.email, 'Utilisateur')
    INTO v_utilisateur_nom
    FROM auth.users u
    LEFT JOIN public.profils p ON p.id = u.id
    WHERE u.id = v_utilisateur_id;

    -- Stocker les valeurs avant
    v_stock_avant_global := v_produit.quantite_totale;
    v_stock_avant_emplacement := v_emplacement.quantite;

    -- Calculer selon le type
    IF p_type_mouvement = 'entree' THEN
        IF p_quantite <= 0 THEN
            RAISE EXCEPTION 'La quantité à entrer doit être supérieure à 0';
        END IF;
        v_stock_apres_emplacement := v_stock_avant_emplacement + p_quantite;
        v_difference := p_quantite;

    ELSIF p_type_mouvement = 'sortie' THEN
        IF p_quantite <= 0 THEN
            RAISE EXCEPTION 'La quantité à sortir doit être supérieure à 0';
        END IF;
        IF p_quantite > v_stock_avant_emplacement THEN
            RAISE EXCEPTION 'Stock insuffisant dans cet emplacement (disponible : %, demandé : %)', v_stock_avant_emplacement, p_quantite;
        END IF;
        v_stock_apres_emplacement := v_stock_avant_emplacement - p_quantite;
        v_difference := -p_quantite;

    ELSIF p_type_mouvement = 'inventaire' THEN
        -- p_quantite = quantité comptée physiquement dans l'emplacement
        IF p_quantite < 0 THEN
            RAISE EXCEPTION 'La quantité comptée ne peut pas être négative';
        END IF;
        v_difference := p_quantite - v_stock_avant_emplacement;
        v_stock_apres_emplacement := p_quantite;

    ELSE
        RAISE EXCEPTION 'Type de mouvement invalide : %', p_type_mouvement;
    END IF;

    -- Calculer le stock global après
    v_stock_apres_global := v_stock_avant_global + v_difference;
    IF v_stock_apres_global < 0 THEN
        v_stock_apres_global := 0;
    END IF;

    -- Mettre à jour l'emplacement
    UPDATE public.emplacements_produit
    SET quantite = v_stock_apres_emplacement
    WHERE id = p_emplacement_id;

    -- Calculer le nouveau statut
    IF v_stock_apres_global <= 0 THEN
        v_nouveau_statut := 'rupture';
    ELSIF v_produit.quantite_min > 0 AND v_stock_apres_global < v_produit.quantite_min THEN
        v_nouveau_statut := 'faible';
    ELSIF v_produit.quantite_max > 0 AND v_stock_apres_global > v_produit.quantite_max THEN
        v_nouveau_statut := 'surstock';
    ELSE
        v_nouveau_statut := 'stock';
    END IF;

    -- Mettre à jour le produit
    UPDATE public.produits
    SET quantite_totale = v_stock_apres_global,
        statut = v_nouveau_statut,
        modifie_le = NOW()
    WHERE id = p_produit_id;

    -- Enregistrer le mouvement
    INSERT INTO public.mouvements_stock (
        entreprise_id, produit_id, emplacement_id,
        type_mouvement, motif, quantite,
        stock_avant_global, stock_apres_global,
        stock_avant_emplacement, stock_apres_emplacement,
        note, utilisateur_id, utilisateur_nom,
        produit_nom, emplacement_nom
    )
    VALUES (
        v_produit.entreprise_id, p_produit_id, p_emplacement_id,
        p_type_mouvement, p_motif, p_quantite,
        v_stock_avant_global, v_stock_apres_global,
        v_stock_avant_emplacement, v_stock_apres_emplacement,
        nullif(trim(COALESCE(p_note, '')), ''),
        v_utilisateur_id, v_utilisateur_nom,
        v_produit.nom, v_emplacement.nom
    )
    RETURNING * INTO v_mouvement;

    RETURN json_build_object(
        'mouvement_id', v_mouvement.id,
        'type', v_mouvement.type_mouvement,
        'produit_nom', v_mouvement.produit_nom,
        'emplacement_nom', v_mouvement.emplacement_nom,
        'quantite', v_mouvement.quantite,
        'stock_avant_global', v_mouvement.stock_avant_global,
        'stock_apres_global', v_mouvement.stock_apres_global,
        'stock_avant_emplacement', v_mouvement.stock_avant_emplacement,
        'stock_apres_emplacement', v_mouvement.stock_apres_emplacement,
        'difference', v_difference,
        'statut', v_nouveau_statut,
        'cree_le', v_mouvement.cree_le
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.effectuer_mouvement_stock(UUID, UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated;

-- ======================================================
-- FONCTION RPC : recuperer_historique_mouvements
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_historique_mouvements(
    p_entreprise_id UUID,
    p_type_filtre TEXT DEFAULT 'tous',
    p_date_debut TIMESTAMPTZ DEFAULT NULL,
    p_date_fin TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultat JSON;
    v_utilisateur_id UUID;
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

    SELECT json_agg(ligne ORDER BY (ligne->>'cree_le') DESC)
    INTO v_resultat
    FROM (
        SELECT json_build_object(
            'id', m.id,
            'type', m.type_mouvement,
            'produit', m.produit_nom,
            'produit_id', m.produit_id,
            'emplacement', m.emplacement_nom,
            'emplacement_id', m.emplacement_id,
            'quantite', m.quantite,
            'avant', m.stock_avant_global,
            'apres', m.stock_apres_global,
            'avant_emplacement', m.stock_avant_emplacement,
            'apres_emplacement', m.stock_apres_emplacement,
            'motif', m.motif,
            'note', m.note,
            'utilisateur', m.utilisateur_nom,
            'utilisateur_id', m.utilisateur_id,
            'cree_le', m.cree_le,
            'date', to_char(m.cree_le AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
            'heure', to_char(m.cree_le AT TIME ZONE 'UTC', 'HH24:MI')
        ) AS ligne
        FROM public.mouvements_stock m
        WHERE m.entreprise_id = p_entreprise_id
        AND (p_type_filtre = 'tous' OR m.type_mouvement = p_type_filtre)
        AND (p_date_debut IS NULL OR m.cree_le >= p_date_debut)
        AND (p_date_fin IS NULL OR m.cree_le <= p_date_fin)
    ) sous_requete;

    RETURN COALESCE(v_resultat, '[]'::JSON);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_historique_mouvements(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- ======================================================
-- Mise à jour RLS emplacements_produit pour permettre
-- aux coordinateurs/auditeurs/opérateurs de modifier la quantité
-- ======================================================
DROP POLICY IF EXISTS "Éditeurs et admins modifient des emplacements" ON public.emplacements_produit;

CREATE POLICY "Membres autorisés modifient des emplacements"
ON public.emplacements_produit FOR UPDATE
TO authenticated
USING (
    produit_id IN (
        SELECT p.id FROM public.produits p WHERE p.entreprise_id IN (
            SELECT me.entreprise_id FROM public.membres_entreprise me
            WHERE me.utilisateur_id = auth.uid()
            AND me.role IN ('administrateur', 'editeur', 'coordinateur', 'auditeur', 'operateur')
        )
    )
);

-- Pareil pour la table produits (la quantite_totale doit être modifiable par ceux qui font des mouvements)
DROP POLICY IF EXISTS "Éditeurs et admins modifient des produits" ON public.produits;

CREATE POLICY "Membres autorisés modifient des produits"
ON public.produits FOR UPDATE
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me
        WHERE me.utilisateur_id = auth.uid()
        AND me.role IN ('administrateur', 'editeur', 'coordinateur', 'auditeur', 'operateur')
    )
);

-- ================================
-- PARTIE 20
-- ================================
-- ================================
-- MIGRATION DES ÉTATS DE STOCK
-- ================================

-- 1) Mettre à jour les statuts existants dans la table produits
UPDATE public.produits
SET statut = 'nul'
WHERE statut = 'rupture';

UPDATE public.produits
SET statut = 'normal'
WHERE statut = 'stock';

UPDATE public.produits
SET statut = 'eleve'
WHERE statut = 'surstock';

-- Le statut 'faible' reste 'faible', pas de changement nécessaire

-- 2) Supprimer l'ancienne fonction enregistrer_produit et la recréer
DROP FUNCTION IF EXISTS public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON);

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

    -- Calculer le statut avec les nouveaux états
    IF p_quantite_totale <= 0 THEN
        v_statut := 'nul';
    ELSIF p_quantite_min > 0 AND p_quantite_totale < p_quantite_min THEN
        v_statut := 'faible';
    ELSIF p_quantite_max > 0 AND p_quantite_totale > p_quantite_max THEN
        v_statut := 'eleve';
    ELSE
        v_statut := 'normal';
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

-- 3) Recréer la fonction effectuer_mouvement_stock
CREATE OR REPLACE FUNCTION public.effectuer_mouvement_stock(
    p_produit_id UUID,
    p_emplacement_id UUID,
    p_type_mouvement TEXT,
    p_motif TEXT,
    p_quantite INTEGER,
    p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id UUID;
    v_utilisateur_nom TEXT;
    v_produit public.produits%ROWTYPE;
    v_emplacement public.emplacements_produit%ROWTYPE;
    v_stock_avant_global INTEGER;
    v_stock_apres_global INTEGER;
    v_stock_avant_emplacement INTEGER;
    v_stock_apres_emplacement INTEGER;
    v_difference INTEGER;
    v_nouveau_statut TEXT;
    v_mouvement public.mouvements_stock%ROWTYPE;
    v_role TEXT;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    -- Récupérer le produit
    SELECT * INTO v_produit FROM public.produits WHERE id = p_produit_id;
    IF v_produit IS NULL THEN
        RAISE EXCEPTION 'Produit introuvable';
    END IF;

    -- Vérifier le rôle
    SELECT me.role INTO v_role
    FROM public.membres_entreprise me
    WHERE me.entreprise_id = v_produit.entreprise_id
    AND me.utilisateur_id = v_utilisateur_id;

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'Vous n''êtes pas membre de cette entreprise';
    END IF;

    -- Vérifier permissions selon type
    IF p_type_mouvement = 'entree' AND v_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'operateur') THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit d''effectuer une entrée de stock';
    END IF;

    IF p_type_mouvement = 'sortie' AND v_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'operateur') THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit d''effectuer une sortie de stock';
    END IF;

    IF p_type_mouvement = 'inventaire' AND v_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'auditeur') THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit d''effectuer un inventaire';
    END IF;

    -- Récupérer l'emplacement
    SELECT * INTO v_emplacement FROM public.emplacements_produit WHERE id = p_emplacement_id AND produit_id = p_produit_id;
    IF v_emplacement IS NULL THEN
        RAISE EXCEPTION 'Emplacement introuvable pour ce produit';
    END IF;

    -- Récupérer le nom de l'utilisateur
    SELECT COALESCE(p.nom_complet, u.email, 'Utilisateur')
    INTO v_utilisateur_nom
    FROM auth.users u
    LEFT JOIN public.profils p ON p.id = u.id
    WHERE u.id = v_utilisateur_id;

    -- Stocker les valeurs avant
    v_stock_avant_global := v_produit.quantite_totale;
    v_stock_avant_emplacement := v_emplacement.quantite;

    -- Calculer selon le type
    IF p_type_mouvement = 'entree' THEN
        IF p_quantite <= 0 THEN
            RAISE EXCEPTION 'La quantité à entrer doit être supérieure à 0';
        END IF;
        v_stock_apres_emplacement := v_stock_avant_emplacement + p_quantite;
        v_difference := p_quantite;

    ELSIF p_type_mouvement = 'sortie' THEN
        IF p_quantite <= 0 THEN
            RAISE EXCEPTION 'La quantité à sortir doit être supérieure à 0';
        END IF;
        IF p_quantite > v_stock_avant_emplacement THEN
            RAISE EXCEPTION 'Stock insuffisant dans cet emplacement (disponible : %, demandé : %)', v_stock_avant_emplacement, p_quantite;
        END IF;
        v_stock_apres_emplacement := v_stock_avant_emplacement - p_quantite;
        v_difference := -p_quantite;

    ELSIF p_type_mouvement = 'inventaire' THEN
        IF p_quantite < 0 THEN
            RAISE EXCEPTION 'La quantité comptée ne peut pas être négative';
        END IF;
        v_difference := p_quantite - v_stock_avant_emplacement;
        v_stock_apres_emplacement := p_quantite;

    ELSE
        RAISE EXCEPTION 'Type de mouvement invalide : %', p_type_mouvement;
    END IF;

    -- Calculer le stock global après
    v_stock_apres_global := v_stock_avant_global + v_difference;
    IF v_stock_apres_global < 0 THEN
        v_stock_apres_global := 0;
    END IF;

    -- Mettre à jour l'emplacement
    UPDATE public.emplacements_produit
    SET quantite = v_stock_apres_emplacement
    WHERE id = p_emplacement_id;

    -- Calculer le nouveau statut avec les nouveaux états
    IF v_stock_apres_global <= 0 THEN
        v_nouveau_statut := 'nul';
    ELSIF v_produit.quantite_min > 0 AND v_stock_apres_global < v_produit.quantite_min THEN
        v_nouveau_statut := 'faible';
    ELSIF v_produit.quantite_max > 0 AND v_stock_apres_global > v_produit.quantite_max THEN
        v_nouveau_statut := 'eleve';
    ELSE
        v_nouveau_statut := 'normal';
    END IF;

    -- Mettre à jour le produit
    UPDATE public.produits
    SET quantite_totale = v_stock_apres_global,
        statut = v_nouveau_statut,
        modifie_le = NOW()
    WHERE id = p_produit_id;

    -- Enregistrer le mouvement
    INSERT INTO public.mouvements_stock (
        entreprise_id, produit_id, emplacement_id,
        type_mouvement, motif, quantite,
        stock_avant_global, stock_apres_global,
        stock_avant_emplacement, stock_apres_emplacement,
        note, utilisateur_id, utilisateur_nom,
        produit_nom, emplacement_nom
    )
    VALUES (
        v_produit.entreprise_id, p_produit_id, p_emplacement_id,
        p_type_mouvement, p_motif, p_quantite,
        v_stock_avant_global, v_stock_apres_global,
        v_stock_avant_emplacement, v_stock_apres_emplacement,
        nullif(trim(COALESCE(p_note, '')), ''),
        v_utilisateur_id, v_utilisateur_nom,
        v_produit.nom, v_emplacement.nom
    )
    RETURNING * INTO v_mouvement;

    RETURN json_build_object(
        'mouvement_id', v_mouvement.id,
        'type', v_mouvement.type_mouvement,
        'produit_nom', v_mouvement.produit_nom,
        'emplacement_nom', v_mouvement.emplacement_nom,
        'quantite', v_mouvement.quantite,
        'stock_avant_global', v_mouvement.stock_avant_global,
        'stock_apres_global', v_mouvement.stock_apres_global,
        'stock_avant_emplacement', v_mouvement.stock_avant_emplacement,
        'stock_apres_emplacement', v_mouvement.stock_apres_emplacement,
        'difference', v_difference,
        'statut', v_nouveau_statut,
        'cree_le', v_mouvement.cree_le
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.effectuer_mouvement_stock(UUID, UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated;

-- ================================
-- PARTIE 21 — TABLE NOTIFICATIONS_STOCK
-- ================================

CREATE TABLE IF NOT EXISTS public.notifications_stock (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entreprise_id UUID NOT NULL REFERENCES public.entreprises(id) ON DELETE CASCADE,
    produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
    statut_declencheur TEXT NOT NULL CHECK (statut_declencheur IN ('nul', 'faible', 'eleve')),
    quantite_au_declenchement INTEGER NOT NULL,
    quantite_actuelle INTEGER NOT NULL,
    quantite_min INTEGER DEFAULT 0,
    quantite_max INTEGER DEFAULT 0,
    produit_nom TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    declenchee_le TIMESTAMPTZ DEFAULT NOW(),
    resolue_le TIMESTAMPTZ DEFAULT NULL
);

ALTER TABLE public.notifications_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Membres voient les notifications de leur entreprise"
ON public.notifications_stock FOR SELECT
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me WHERE me.utilisateur_id = auth.uid()
    )
);

CREATE POLICY "Système insère des notifications"
ON public.notifications_stock FOR INSERT
TO authenticated
WITH CHECK (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me WHERE me.utilisateur_id = auth.uid()
    )
);

CREATE POLICY "Système met à jour des notifications"
ON public.notifications_stock FOR UPDATE
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me WHERE me.utilisateur_id = auth.uid()
    )
);

CREATE POLICY "Admins suppriment des notifications"
ON public.notifications_stock FOR DELETE
TO authenticated
USING (
    entreprise_id IN (
        SELECT me.entreprise_id FROM public.membres_entreprise me
        WHERE me.utilisateur_id = auth.uid()
        AND me.role = 'administrateur'
    )
);

CREATE INDEX IF NOT EXISTS idx_notifications_stock_entreprise ON public.notifications_stock(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_notifications_stock_produit ON public.notifications_stock(produit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_stock_active ON public.notifications_stock(active);
CREATE INDEX IF NOT EXISTS idx_notifications_stock_date ON public.notifications_stock(declenchee_le DESC);


-- ================================
-- PARTIE 22 : gerer_notification_stock
-- ================================
CREATE OR REPLACE FUNCTION public.gerer_notification_stock(
    p_produit_id UUID,
    p_entreprise_id UUID,
    p_ancien_statut TEXT,
    p_nouveau_statut TEXT,
    p_quantite_actuelle INTEGER,
    p_quantite_min INTEGER,
    p_quantite_max INTEGER,
    p_produit_nom TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_nid UUID;
    v_nstatut TEXT;
BEGIN
    IF p_nouveau_statut = 'normal' THEN
        UPDATE public.notifications_stock
        SET active = FALSE,
            resolue_le = NOW()
        WHERE produit_id = p_produit_id
        AND active = TRUE;
        RETURN;
    END IF;

    v_nid := (
        SELECT ns.id FROM public.notifications_stock ns
        WHERE ns.produit_id = p_produit_id
        AND ns.active = TRUE
        LIMIT 1
    );

    IF v_nid IS NOT NULL THEN
        v_nstatut := (
            SELECT ns.statut_declencheur FROM public.notifications_stock ns
            WHERE ns.id = v_nid
        );

        IF v_nstatut = p_nouveau_statut THEN
            UPDATE public.notifications_stock
            SET quantite_actuelle = p_quantite_actuelle
            WHERE id = v_nid;
        ELSE
            UPDATE public.notifications_stock
            SET active = FALSE,
                resolue_le = NOW()
            WHERE id = v_nid;

            INSERT INTO public.notifications_stock (
                entreprise_id, produit_id, statut_declencheur,
                quantite_au_declenchement, quantite_actuelle,
                quantite_min, quantite_max, produit_nom
            )
            VALUES (
                p_entreprise_id, p_produit_id, p_nouveau_statut,
                p_quantite_actuelle, p_quantite_actuelle,
                p_quantite_min, p_quantite_max, p_produit_nom
            );
        END IF;
    ELSE
        INSERT INTO public.notifications_stock (
            entreprise_id, produit_id, statut_declencheur,
            quantite_au_declenchement, quantite_actuelle,
            quantite_min, quantite_max, produit_nom
        )
        VALUES (
            p_entreprise_id, p_produit_id, p_nouveau_statut,
            p_quantite_actuelle, p_quantite_actuelle,
            p_quantite_min, p_quantite_max, p_produit_nom
        );
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.gerer_notification_stock(UUID, UUID, TEXT, TEXT, INTEGER, INTEGER, INTEGER, TEXT) TO authenticated;


-- ================================
-- PARTIE 23 : effectuer_mouvement_stock avec notifications
-- ZERO SELECT ... INTO — uniquement des := (SELECT ...)
-- ================================
CREATE OR REPLACE FUNCTION public.effectuer_mouvement_stock(
    p_produit_id UUID,
    p_emplacement_id UUID,
    p_type_mouvement TEXT,
    p_motif TEXT,
    p_quantite INTEGER,
    p_note TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id UUID;
    v_utilisateur_nom TEXT;
    v_pe UUID;
    v_pnom TEXT;
    v_pqt INTEGER;
    v_pqmin INTEGER;
    v_pqmax INTEGER;
    v_pstatut TEXT;
    v_enom TEXT;
    v_eqt INTEGER;
    v_sag INTEGER;
    v_sapg INTEGER;
    v_sae INTEGER;
    v_sape INTEGER;
    v_diff INTEGER;
    v_as TEXT;
    v_ns TEXT;
    v_mid UUID;
    v_mcl TIMESTAMPTZ;
    v_role TEXT;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    -- Récupérer le produit via assignation pure
    v_pe := (SELECT pr.entreprise_id FROM public.produits pr WHERE pr.id = p_produit_id);
    v_pnom := (SELECT pr.nom FROM public.produits pr WHERE pr.id = p_produit_id);
    v_pqt := (SELECT pr.quantite_totale FROM public.produits pr WHERE pr.id = p_produit_id);
    v_pqmin := (SELECT pr.quantite_min FROM public.produits pr WHERE pr.id = p_produit_id);
    v_pqmax := (SELECT pr.quantite_max FROM public.produits pr WHERE pr.id = p_produit_id);
    v_pstatut := (SELECT pr.statut FROM public.produits pr WHERE pr.id = p_produit_id);

    IF v_pe IS NULL THEN
        RAISE EXCEPTION 'Produit introuvable';
    END IF;

    v_as := v_pstatut;

    -- Vérifier le rôle via assignation pure
    v_role := (
        SELECT me.role FROM public.membres_entreprise me
        WHERE me.entreprise_id = v_pe AND me.utilisateur_id = v_utilisateur_id
    );

    IF v_role IS NULL THEN
        RAISE EXCEPTION 'Vous n''êtes pas membre de cette entreprise';
    END IF;

    IF p_type_mouvement = 'entree' AND v_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'operateur') THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit d''effectuer une entrée de stock';
    END IF;

    IF p_type_mouvement = 'sortie' AND v_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'operateur') THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit d''effectuer une sortie de stock';
    END IF;

    IF p_type_mouvement = 'inventaire' AND v_role NOT IN ('administrateur', 'editeur', 'coordinateur', 'auditeur') THEN
        RAISE EXCEPTION 'Vous n''avez pas le droit d''effectuer un inventaire';
    END IF;

    -- Récupérer l'emplacement via assignation pure
    v_enom := (
        SELECT ep.nom FROM public.emplacements_produit ep
        WHERE ep.id = p_emplacement_id AND ep.produit_id = p_produit_id
    );
    v_eqt := (
        SELECT ep.quantite FROM public.emplacements_produit ep
        WHERE ep.id = p_emplacement_id AND ep.produit_id = p_produit_id
    );

    IF v_enom IS NULL THEN
        RAISE EXCEPTION 'Emplacement introuvable pour ce produit';
    END IF;

    -- Récupérer le nom de l'utilisateur via assignation pure
    v_utilisateur_nom := (
        SELECT COALESCE(pf.nom_complet, u.email, 'Utilisateur')
        FROM auth.users u
        LEFT JOIN public.profils pf ON pf.id = u.id
        WHERE u.id = v_utilisateur_id
    );

    v_sag := v_pqt;
    v_sae := v_eqt;

    IF p_type_mouvement = 'entree' THEN
        IF p_quantite <= 0 THEN
            RAISE EXCEPTION 'La quantité à entrer doit être supérieure à 0';
        END IF;
        v_sape := v_sae + p_quantite;
        v_diff := p_quantite;

    ELSIF p_type_mouvement = 'sortie' THEN
        IF p_quantite <= 0 THEN
            RAISE EXCEPTION 'La quantité à sortir doit être supérieure à 0';
        END IF;
        IF p_quantite > v_sae THEN
            RAISE EXCEPTION 'Stock insuffisant dans cet emplacement (disponible : %, demandé : %)', v_sae, p_quantite;
        END IF;
        v_sape := v_sae - p_quantite;
        v_diff := -p_quantite;

    ELSIF p_type_mouvement = 'inventaire' THEN
        IF p_quantite < 0 THEN
            RAISE EXCEPTION 'La quantité comptée ne peut pas être négative';
        END IF;
        v_diff := p_quantite - v_sae;
        v_sape := p_quantite;

    ELSE
        RAISE EXCEPTION 'Type de mouvement invalide : %', p_type_mouvement;
    END IF;

    v_sapg := v_sag + v_diff;
    IF v_sapg < 0 THEN
        v_sapg := 0;
    END IF;

    UPDATE public.emplacements_produit
    SET quantite = v_sape
    WHERE id = p_emplacement_id;

    IF v_sapg <= 0 THEN
        v_ns := 'nul';
    ELSIF v_pqmin > 0 AND v_sapg < v_pqmin THEN
        v_ns := 'faible';
    ELSIF v_pqmax > 0 AND v_sapg > v_pqmax THEN
        v_ns := 'eleve';
    ELSE
        v_ns := 'normal';
    END IF;

    UPDATE public.produits
    SET quantite_totale = v_sapg,
        statut = v_ns,
        modifie_le = NOW()
    WHERE id = p_produit_id;

    -- GESTION NOTIFICATION
    IF v_as IS DISTINCT FROM v_ns THEN
        PERFORM public.gerer_notification_stock(
            p_produit_id, v_pe, v_as, v_ns, v_sapg, v_pqmin, v_pqmax, v_pnom
        );
    ELSE
        IF v_ns IN ('nul', 'faible', 'eleve') THEN
            UPDATE public.notifications_stock
            SET quantite_actuelle = v_sapg
            WHERE produit_id = p_produit_id
            AND active = TRUE;
        END IF;
    END IF;

    INSERT INTO public.mouvements_stock (
        entreprise_id, produit_id, emplacement_id,
        type_mouvement, motif, quantite,
        stock_avant_global, stock_apres_global,
        stock_avant_emplacement, stock_apres_emplacement,
        note, utilisateur_id, utilisateur_nom,
        produit_nom, emplacement_nom
    )
    VALUES (
        v_pe, p_produit_id, p_emplacement_id,
        p_type_mouvement, p_motif, p_quantite,
        v_sag, v_sapg, v_sae, v_sape,
        nullif(trim(COALESCE(p_note, '')), ''),
        v_utilisateur_id, v_utilisateur_nom,
        v_pnom, v_enom
    );

    v_mid := (
        SELECT ms.id FROM public.mouvements_stock ms
        WHERE ms.produit_id = p_produit_id
        AND ms.utilisateur_id = v_utilisateur_id
        ORDER BY ms.cree_le DESC LIMIT 1
    );
    v_mcl := (
        SELECT ms.cree_le FROM public.mouvements_stock ms
        WHERE ms.id = v_mid
    );

    RETURN json_build_object(
        'mouvement_id', v_mid,
        'type', p_type_mouvement,
        'produit_nom', v_pnom,
        'emplacement_nom', v_enom,
        'quantite', p_quantite,
        'stock_avant_global', v_sag,
        'stock_apres_global', v_sapg,
        'stock_avant_emplacement', v_sae,
        'stock_apres_emplacement', v_sape,
        'difference', v_diff,
        'statut', v_ns,
        'cree_le', v_mcl
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.effectuer_mouvement_stock(UUID, UUID, TEXT, TEXT, INTEGER, TEXT) TO authenticated;

-- ================================
-- PARTIE 24 : enregistrer_produit avec notifications
-- ZERO SELECT ... INTO
-- ================================
DROP FUNCTION IF EXISTS public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON);

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
    v_pid UUID;
    v_statut TEXT;
    v_emplacement JSON;
    v_utilisateur_id UUID;
    v_result JSON;
    v_qt INTEGER;
    v_qmin INTEGER;
    v_qmax INTEGER;
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

    v_qt := COALESCE(p_quantite_totale, 0);
    v_qmin := COALESCE(p_quantite_min, 0);
    v_qmax := COALESCE(p_quantite_max, 0);

    IF v_qt <= 0 THEN
        v_statut := 'nul';
    ELSIF v_qmin > 0 AND v_qt < v_qmin THEN
        v_statut := 'faible';
    ELSIF v_qmax > 0 AND v_qt > v_qmax THEN
        v_statut := 'eleve';
    ELSE
        v_statut := 'normal';
    END IF;

    INSERT INTO public.produits (
        entreprise_id, nom, code, code_barres, categorie_id,
        quantite_totale, quantite_min, quantite_max,
        prix_achat, prix_vente, notes, photo_url, statut
    )
    VALUES (
        p_entreprise_id, trim(p_nom),
        nullif(trim(COALESCE(p_code, '')), ''),
        nullif(trim(COALESCE(p_code_barres, '')), ''),
        p_categorie_id,
        v_qt, v_qmin, v_qmax,
        COALESCE(p_prix_achat, 0), COALESCE(p_prix_vente, 0),
        nullif(trim(COALESCE(p_notes, '')), ''),
        p_photo_url, v_statut
    );

    v_pid := (
        SELECT pr.id FROM public.produits pr
        WHERE pr.entreprise_id = p_entreprise_id
        AND pr.nom = trim(p_nom)
        ORDER BY pr.cree_le DESC LIMIT 1
    );

    IF p_emplacements IS NOT NULL THEN
        FOR v_emplacement IN SELECT * FROM json_array_elements(p_emplacements)
        LOOP
            INSERT INTO public.emplacements_produit (produit_id, nom, quantite)
            VALUES (
                v_pid,
                trim(COALESCE((v_emplacement->>'nom')::TEXT, '')),
                COALESCE((v_emplacement->>'quantite')::INTEGER, 0)
            );
        END LOOP;
    END IF;

    IF v_statut IN ('nul', 'faible', 'eleve') THEN
        PERFORM public.gerer_notification_stock(
            v_pid, p_entreprise_id, 'normal', v_statut,
            v_qt, v_qmin, v_qmax, trim(p_nom)
        );
    END IF;

    v_result := (
        SELECT row_to_json(pr) FROM public.produits pr WHERE pr.id = v_pid
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON) TO authenticated;

-- ================================
-- PARTIE 25 : recuperer_notifications_stock + seed
-- ================================
CREATE OR REPLACE FUNCTION public.recuperer_notifications_stock(
    p_entreprise_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultat JSON;
    v_utilisateur_id UUID;
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

    v_resultat := (
        SELECT COALESCE(json_agg(ligne ORDER BY (ligne->>'declenchee_le') DESC), '[]'::JSON)
        FROM (
            SELECT json_build_object(
                'id', n.id,
                'produit_id', n.produit_id,
                'produit_nom', n.produit_nom,
                'statut_declencheur', n.statut_declencheur,
                'quantite_au_declenchement', n.quantite_au_declenchement,
                'quantite_actuelle', n.quantite_actuelle,
                'quantite_min', n.quantite_min,
                'quantite_max', n.quantite_max,
                'active', n.active,
                'declenchee_le', n.declenchee_le,
                'resolue_le', n.resolue_le
            ) AS ligne
            FROM public.notifications_stock n
            WHERE n.entreprise_id = p_entreprise_id
            AND n.active = TRUE
        ) sous_requete
    );

    RETURN v_resultat;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_notifications_stock(UUID) TO authenticated;

-- Générer les notifications pour les produits existants en état critique
INSERT INTO public.notifications_stock (
    entreprise_id, produit_id, statut_declencheur,
    quantite_au_declenchement, quantite_actuelle,
    quantite_min, quantite_max, produit_nom
)
SELECT
    p.entreprise_id,
    p.id,
    p.statut,
    p.quantite_totale,
    p.quantite_totale,
    p.quantite_min,
    p.quantite_max,
    p.nom
FROM public.produits p
WHERE p.statut IN ('nul', 'faible', 'eleve')
AND NOT EXISTS (
    SELECT 1 FROM public.notifications_stock ns
    WHERE ns.produit_id = p.id
    AND ns.active = TRUE
);

-- ================================
-- PARTIE 26
-- ================================
ALTER TABLE public.produits
ADD COLUMN IF NOT EXISTS format_code_barres TEXT DEFAULT NULL;

-- ================================
-- PARTIE 27
-- ================================
DROP FUNCTION IF EXISTS public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON);
DROP FUNCTION IF EXISTS public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON);

-- ================================
-- PARTIE 28
-- ================================
CREATE OR REPLACE FUNCTION public.enregistrer_produit(
    p_entreprise_id UUID,
    p_nom TEXT,
    p_code TEXT DEFAULT NULL,
    p_code_barres TEXT DEFAULT NULL,
    p_format_code_barres TEXT DEFAULT NULL,
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
    v_pid UUID;
    v_statut TEXT;
    v_emplacement JSON;
    v_utilisateur_id UUID;
    v_result JSON;
    v_qt INTEGER;
    v_qmin INTEGER;
    v_qmax INTEGER;
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

    v_qt := COALESCE(p_quantite_totale, 0);
    v_qmin := COALESCE(p_quantite_min, 0);
    v_qmax := COALESCE(p_quantite_max, 0);

    IF v_qt <= 0 THEN
        v_statut := 'nul';
    ELSIF v_qmin > 0 AND v_qt < v_qmin THEN
        v_statut := 'faible';
    ELSIF v_qmax > 0 AND v_qt > v_qmax THEN
        v_statut := 'eleve';
    ELSE
        v_statut := 'normal';
    END IF;

    INSERT INTO public.produits (
        entreprise_id, nom, code, code_barres, format_code_barres, categorie_id,
        quantite_totale, quantite_min, quantite_max,
        prix_achat, prix_vente, notes, photo_url, statut
    )
    VALUES (
        p_entreprise_id, trim(p_nom),
        nullif(trim(COALESCE(p_code, '')), ''),
        nullif(trim(COALESCE(p_code_barres, '')), ''),
        nullif(trim(COALESCE(p_format_code_barres, '')), ''),
        p_categorie_id,
        v_qt, v_qmin, v_qmax,
        COALESCE(p_prix_achat, 0), COALESCE(p_prix_vente, 0),
        nullif(trim(COALESCE(p_notes, '')), ''),
        p_photo_url, v_statut
    );

    v_pid := (
        SELECT pr.id FROM public.produits pr
        WHERE pr.entreprise_id = p_entreprise_id
        AND pr.nom = trim(p_nom)
        ORDER BY pr.cree_le DESC LIMIT 1
    );

    IF p_emplacements IS NOT NULL THEN
        FOR v_emplacement IN SELECT * FROM json_array_elements(p_emplacements)
        LOOP
            INSERT INTO public.emplacements_produit (produit_id, nom, quantite)
            VALUES (
                v_pid,
                trim(COALESCE((v_emplacement->>'nom')::TEXT, '')),
                COALESCE((v_emplacement->>'quantite')::INTEGER, 0)
            );
        END LOOP;
    END IF;

    IF v_statut IN ('nul', 'faible', 'eleve') THEN
        PERFORM public.gerer_notification_stock(
            v_pid, p_entreprise_id, 'normal', v_statut,
            v_qt, v_qmin, v_qmax, trim(p_nom)
        );
    END IF;

    v_result := (
        SELECT row_to_json(pr) FROM public.produits pr WHERE pr.id = v_pid
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON) TO authenticated;

-- ================================
-- PARTIE 29
-- ================================
CREATE OR REPLACE FUNCTION public.recuperer_produits_entreprise(
    p_entreprise_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
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

    v_resultat := (
        SELECT json_agg(ligne ORDER BY ligne->>'nom')
        FROM (
            SELECT json_build_object(
                'id', p.id,
                'nom', p.nom,
                'code', p.code,
                'code_barres', p.code_barres,
                'format_code_barres', p.format_code_barres,
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
        ) sous_requete
    );

    RETURN COALESCE(v_resultat, '[]'::JSON);
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.recuperer_produits_entreprise(UUID) TO authenticated;

-- ================================
-- PARTIE 30
-- ================================
CREATE OR REPLACE FUNCTION public.recuperer_details_produit(
    p_produit_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
    v_resultat JSON;
    v_utilisateur_id uuid;
BEGIN
    v_utilisateur_id := auth.uid();

    IF v_utilisateur_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur non connecté';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.produits p
        JOIN public.membres_entreprise me ON me.entreprise_id = p.entreprise_id
        WHERE p.id = p_produit_id
        AND me.utilisateur_id = v_utilisateur_id
    ) THEN
        RAISE EXCEPTION 'Vous n''avez pas accès à ce produit';
    END IF;

    v_resultat := (
        SELECT json_build_object(
            'id', p.id,
            'nom', p.nom,
            'code', p.code,
            'code_barres', p.code_barres,
            'format_code_barres', p.format_code_barres,
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
        FROM public.produits p
        LEFT JOIN public.categories c ON c.id = p.categorie_id
        WHERE p.id = p_produit_id
    );

    RETURN v_resultat;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.recuperer_details_produit(UUID) TO authenticated;

-- ================================
-- PARTIE 31 — FONCTIONS RPC RAPPORTS DYNAMIQUES
-- ================================

-- ======================================================
-- FONCTION RPC : recuperer_rapport_actualite_rapport
-- Rapports d'actualité basés sur l'état actuel du stock
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_rapport_actualite_rapport(
    p_entreprise_id UUID,
    p_type_rapport TEXT -- 'global', 'normal', 'faible', 'nul', 'eleve'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultat JSON;
    v_utilisateur_id UUID;
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

    v_resultat := (
        SELECT COALESCE(json_agg(ligne ORDER BY (ligne->>'nom')), '[]'::JSON)
        FROM (
            SELECT json_build_object(
                'id', p.id,
                'code', COALESCE(p.code, '—'),
                'nom', p.nom,
                'categorie', COALESCE(c.nom, 'Sans catégorie'),
                'quantite', p.quantite_totale,
                'min', p.quantite_min,
                'max', p.quantite_max,
                'prix_achat', p.prix_achat,
                'prix_vente', p.prix_vente,
                'statut', p.statut
            ) AS ligne
            FROM public.produits p
            LEFT JOIN public.categories c ON c.id = p.categorie_id
            WHERE p.entreprise_id = p_entreprise_id
            AND (
                p_type_rapport = 'global'
                OR (p_type_rapport = 'normal' AND p.statut = 'normal')
                OR (p_type_rapport = 'faible' AND p.statut = 'faible')
                OR (p_type_rapport = 'nul' AND p.statut = 'nul')
                OR (p_type_rapport = 'eleve' AND p.statut = 'eleve')
            )
        ) sous_requete
    );

    RETURN COALESCE(v_resultat, '[]'::JSON);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_rapport_actualite_rapport(UUID, TEXT) TO authenticated;

-- ======================================================
-- FONCTION RPC : recuperer_compteurs_rapports_rapport
-- Retourne les compteurs pour l'écran liste des rapports
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_compteurs_rapports_rapport(
    p_entreprise_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultat JSON;
    v_utilisateur_id UUID;
    v_total INTEGER;
    v_normal INTEGER;
    v_faible INTEGER;
    v_nul INTEGER;
    v_eleve INTEGER;
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

    v_total := (SELECT COUNT(*) FROM public.produits WHERE entreprise_id = p_entreprise_id);
    v_normal := (SELECT COUNT(*) FROM public.produits WHERE entreprise_id = p_entreprise_id AND statut = 'normal');
    v_faible := (SELECT COUNT(*) FROM public.produits WHERE entreprise_id = p_entreprise_id AND statut = 'faible');
    v_nul := (SELECT COUNT(*) FROM public.produits WHERE entreprise_id = p_entreprise_id AND statut = 'nul');
    v_eleve := (SELECT COUNT(*) FROM public.produits WHERE entreprise_id = p_entreprise_id AND statut = 'eleve');

    v_resultat := json_build_object(
        'total', v_total,
        'normal', v_normal,
        'faible', v_faible,
        'nul', v_nul,
        'eleve', v_eleve
    );

    RETURN v_resultat;
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_compteurs_rapports_rapport(UUID) TO authenticated;

-- ======================================================
-- FONCTION RPC : recuperer_rapport_budgetaire_rapport
-- Rapports budgétaires basés sur les mouvements (achats, ventes, pertes)
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_rapport_budgetaire_rapport(
    p_entreprise_id UUID,
    p_type_rapport TEXT, -- 'achats', 'ventes', 'pertes', 'finance'
    p_date_debut TIMESTAMPTZ DEFAULT NULL,
    p_date_fin TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultat JSON;
    v_utilisateur_id UUID;
    v_motifs_achats TEXT[];
    v_motifs_ventes TEXT[];
    v_motifs_pertes TEXT[];
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

    -- Définir les motifs par catégorie
    -- Achats = entrées avec motif "Achat" ou "Production"
    v_motifs_achats := ARRAY['Achat', 'Production'];
    -- Ventes = sorties avec motif "Vente"
    v_motifs_ventes := ARRAY['Vente'];
    -- Pertes = sorties avec motifs autres que "Vente" et "Retour fournisseur"
    v_motifs_pertes := ARRAY['Usage interne', 'Casse', 'Autre'];

    IF p_type_rapport = 'achats' THEN
        v_resultat := (
            SELECT COALESCE(json_agg(ligne ORDER BY (ligne->>'prix_total')::NUMERIC DESC), '[]'::JSON)
            FROM (
                SELECT json_build_object(
                    'produit', m.produit_nom,
                    'quantite', SUM(m.quantite),
                    'prix_unitaire', COALESCE(p.prix_achat, 0),
                    'prix_total', SUM(m.quantite) * COALESCE(p.prix_achat, 0)
                ) AS ligne
                FROM public.mouvements_stock m
                LEFT JOIN public.produits p ON p.id = m.produit_id
                WHERE m.entreprise_id = p_entreprise_id
                AND m.type_mouvement = 'entree'
                AND m.motif = ANY(v_motifs_achats)
                AND (p_date_debut IS NULL OR m.cree_le >= p_date_debut)
                AND (p_date_fin IS NULL OR m.cree_le <= p_date_fin)
                GROUP BY m.produit_nom, m.produit_id, p.prix_achat
            ) sous_requete
        );

    ELSIF p_type_rapport = 'ventes' THEN
        v_resultat := (
            SELECT COALESCE(json_agg(ligne ORDER BY (ligne->>'prix_total')::NUMERIC DESC), '[]'::JSON)
            FROM (
                SELECT json_build_object(
                    'produit', m.produit_nom,
                    'quantite', SUM(m.quantite),
                    'prix_unitaire', COALESCE(p.prix_vente, 0),
                    'prix_total', SUM(m.quantite) * COALESCE(p.prix_vente, 0)
                ) AS ligne
                FROM public.mouvements_stock m
                LEFT JOIN public.produits p ON p.id = m.produit_id
                WHERE m.entreprise_id = p_entreprise_id
                AND m.type_mouvement = 'sortie'
                AND m.motif = ANY(v_motifs_ventes)
                AND (p_date_debut IS NULL OR m.cree_le >= p_date_debut)
                AND (p_date_fin IS NULL OR m.cree_le <= p_date_fin)
                GROUP BY m.produit_nom, m.produit_id, p.prix_vente
            ) sous_requete
        );

    ELSIF p_type_rapport = 'pertes' THEN
        v_resultat := (
            SELECT COALESCE(json_agg(ligne ORDER BY (ligne->>'prix_total')::NUMERIC DESC), '[]'::JSON)
            FROM (
                SELECT json_build_object(
                    'produit', m.produit_nom,
                    'quantite', SUM(m.quantite),
                    'motif', m.motif,
                    'prix_unitaire', COALESCE(p.prix_achat, 0),
                    'prix_total', SUM(m.quantite) * COALESCE(p.prix_achat, 0)
                ) AS ligne
                FROM public.mouvements_stock m
                LEFT JOIN public.produits p ON p.id = m.produit_id
                WHERE m.entreprise_id = p_entreprise_id
                AND m.type_mouvement = 'sortie'
                AND m.motif != ALL(v_motifs_ventes)
                AND m.motif != 'Retour fournisseur'
                AND (p_date_debut IS NULL OR m.cree_le >= p_date_debut)
                AND (p_date_fin IS NULL OR m.cree_le <= p_date_fin)
                GROUP BY m.produit_nom, m.produit_id, m.motif, p.prix_achat
            ) sous_requete
        );

    ELSIF p_type_rapport = 'finance' THEN
        -- Rapport financier : résumé achats / ventes / pertes
        DECLARE
            v_total_achats NUMERIC;
            v_total_ventes NUMERIC;
            v_total_pertes NUMERIC;
        BEGIN
            v_total_achats := COALESCE((
                SELECT SUM(m.quantite * COALESCE(p.prix_achat, 0))
                FROM public.mouvements_stock m
                LEFT JOIN public.produits p ON p.id = m.produit_id
                WHERE m.entreprise_id = p_entreprise_id
                AND m.type_mouvement = 'entree'
                AND m.motif = ANY(v_motifs_achats)
                AND (p_date_debut IS NULL OR m.cree_le >= p_date_debut)
                AND (p_date_fin IS NULL OR m.cree_le <= p_date_fin)
            ), 0);

            v_total_ventes := COALESCE((
                SELECT SUM(m.quantite * COALESCE(p.prix_vente, 0))
                FROM public.mouvements_stock m
                LEFT JOIN public.produits p ON p.id = m.produit_id
                WHERE m.entreprise_id = p_entreprise_id
                AND m.type_mouvement = 'sortie'
                AND m.motif = ANY(v_motifs_ventes)
                AND (p_date_debut IS NULL OR m.cree_le >= p_date_debut)
                AND (p_date_fin IS NULL OR m.cree_le <= p_date_fin)
            ), 0);

            v_total_pertes := COALESCE((
                SELECT SUM(m.quantite * COALESCE(p.prix_achat, 0))
                FROM public.mouvements_stock m
                LEFT JOIN public.produits p ON p.id = m.produit_id
                WHERE m.entreprise_id = p_entreprise_id
                AND m.type_mouvement = 'sortie'
                AND m.motif != ALL(v_motifs_ventes)
                AND m.motif != 'Retour fournisseur'
                AND (p_date_debut IS NULL OR m.cree_le >= p_date_debut)
                AND (p_date_fin IS NULL OR m.cree_le <= p_date_fin)
            ), 0);

            v_resultat := json_build_object(
                'total_achats', v_total_achats,
                'total_ventes', v_total_ventes,
                'total_pertes', v_total_pertes,
                'benefice_net', v_total_ventes - v_total_achats - v_total_pertes,
                'marge', CASE WHEN v_total_ventes > 0
                    THEN ROUND(((v_total_ventes - v_total_achats - v_total_pertes) / v_total_ventes * 100)::NUMERIC, 1)
                    ELSE 0
                END
            );
        END;

    ELSE
        RAISE EXCEPTION 'Type de rapport invalide : %', p_type_rapport;
    END IF;

    RETURN COALESCE(v_resultat, '[]'::JSON);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_rapport_budgetaire_rapport(UUID, TEXT, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- ======================================================
-- FONCTION RPC : recuperer_totaux_budgetaires_rapport
-- Retourne les totaux pour les cartes budgétaires
-- de l'écran liste des rapports (sans filtre de période = tout le temps)
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_totaux_budgetaires_rapport(
    p_entreprise_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id UUID;
    v_total_achats NUMERIC;
    v_total_ventes NUMERIC;
    v_total_pertes NUMERIC;
    v_devise TEXT;
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

    v_devise := COALESCE((
        SELECT e.devise FROM public.entreprises e WHERE e.id = p_entreprise_id
    ), '$');

    -- Achats = entrées avec motif Achat ou Production
    v_total_achats := COALESCE((
        SELECT SUM(m.quantite * COALESCE(p.prix_achat, 0))
        FROM public.mouvements_stock m
        LEFT JOIN public.produits p ON p.id = m.produit_id
        WHERE m.entreprise_id = p_entreprise_id
        AND m.type_mouvement = 'entree'
        AND m.motif IN ('Achat', 'Production')
    ), 0);

    -- Ventes = sorties avec motif Vente
    v_total_ventes := COALESCE((
        SELECT SUM(m.quantite * COALESCE(p.prix_vente, 0))
        FROM public.mouvements_stock m
        LEFT JOIN public.produits p ON p.id = m.produit_id
        WHERE m.entreprise_id = p_entreprise_id
        AND m.type_mouvement = 'sortie'
        AND m.motif = 'Vente'
    ), 0);

    -- Pertes = sorties avec motifs autres que Vente et Retour fournisseur
    v_total_pertes := COALESCE((
        SELECT SUM(m.quantite * COALESCE(p.prix_achat, 0))
        FROM public.mouvements_stock m
        LEFT JOIN public.produits p ON p.id = m.produit_id
        WHERE m.entreprise_id = p_entreprise_id
        AND m.type_mouvement = 'sortie'
        AND m.motif NOT IN ('Vente', 'Retour fournisseur')
    ), 0);

    RETURN json_build_object(
        'total_achats', v_total_achats,
        'total_ventes', v_total_ventes,
        'total_pertes', v_total_pertes,
        'benefice_net', v_total_ventes - v_total_achats - v_total_pertes,
        'devise', v_devise
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_totaux_budgetaires_rapport(UUID) TO authenticated;

-- ================================
-- PARTIE 32 — STATISTIQUES ACCUEIL + MOUVEMENTS RÉCENTS
-- ================================

-- ======================================================
-- FONCTION RPC : recuperer_statistiques_accueil
-- Retourne les stats pour l'écran d'accueil
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_statistiques_accueil(
    p_entreprise_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_utilisateur_id UUID;
    v_en_stock INTEGER;
    v_faible INTEGER;
    v_nul INTEGER;
    v_valeur_totale NUMERIC;
    v_devise TEXT;
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

    -- En stock = produits avec quantite_totale > 0 (peu importe le statut : normal, faible, eleve)
    v_en_stock := (
        SELECT COUNT(*) FROM public.produits
        WHERE entreprise_id = p_entreprise_id
        AND quantite_totale > 0
    );

    -- Stock faible
    v_faible := (
        SELECT COUNT(*) FROM public.produits
        WHERE entreprise_id = p_entreprise_id
        AND statut = 'faible'
    );

    -- Rupture (stock nul)
    v_nul := (
        SELECT COUNT(*) FROM public.produits
        WHERE entreprise_id = p_entreprise_id
        AND statut = 'nul'
    );

    -- Valeur totale = somme de (quantite_totale * prix_achat) pour tous les produits
    v_valeur_totale := COALESCE((
        SELECT SUM(p.quantite_totale * p.prix_achat)
        FROM public.produits p
        WHERE p.entreprise_id = p_entreprise_id
    ), 0);

    -- Devise de l'entreprise
    v_devise := COALESCE((
        SELECT e.devise FROM public.entreprises e WHERE e.id = p_entreprise_id
    ), '$');

    RETURN json_build_object(
        'en_stock', v_en_stock,
        'faible', v_faible,
        'nul', v_nul,
        'valeur_totale', v_valeur_totale,
        'devise', v_devise
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_statistiques_accueil(UUID) TO authenticated;

-- ======================================================
-- FONCTION RPC : recuperer_mouvements_recents_accueil
-- Retourne les 10 derniers mouvements pour l'écran d'accueil
-- ======================================================
CREATE OR REPLACE FUNCTION public.recuperer_mouvements_recents_accueil(
    p_entreprise_id UUID,
    p_limite INTEGER DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_resultat JSON;
    v_utilisateur_id UUID;
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

    v_resultat := (
        SELECT COALESCE(json_agg(ligne), '[]'::JSON)
        FROM (
            SELECT json_build_object(
                'id', m.id,
                'type', m.type_mouvement,
                'produit', m.produit_nom,
                'produit_id', m.produit_id,
                'emplacement', m.emplacement_nom,
                'quantite', m.quantite,
                'avant', m.stock_avant_global,
                'apres', m.stock_apres_global,
                'motif', m.motif,
                'note', m.note,
                'utilisateur', m.utilisateur_nom,
                'cree_le', m.cree_le,
                'date', to_char(m.cree_le AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
                'heure', to_char(m.cree_le AT TIME ZONE 'UTC', 'HH24:MI')
            ) AS ligne
            FROM public.mouvements_stock m
            WHERE m.entreprise_id = p_entreprise_id
            ORDER BY m.cree_le DESC
            LIMIT p_limite
        ) sous_requete
    );

    RETURN COALESCE(v_resultat, '[]'::JSON);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recuperer_mouvements_recents_accueil(UUID, INTEGER) TO authenticated;


-- ================================
-- PARTIE 33
-- ================================
-- ================================
-- FONCTION SQL : completer_code_avec_controle
-- Utilisée par enregistrer_produit pour garantir la cohérence côté serveur
-- ================================
CREATE OR REPLACE FUNCTION public.completer_code_avec_controle(
    p_code TEXT,
    p_format TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_longueur_partielle INTEGER;
    v_longueur_complete INTEGER;
    v_chiffres INTEGER[];
    v_somme INTEGER := 0;
    v_poids INTEGER;
    v_reste INTEGER;
    v_controle INTEGER;
    i INTEGER;
    v_longueur INTEGER;
BEGIN
    IF p_code IS NULL OR p_code = '' OR p_format IS NULL THEN
        RETURN p_code;
    END IF;

    -- Vérifier que le code est numérique
    IF p_code !~ '^\d+$' THEN
        RETURN p_code;
    END IF;

    -- Définir les longueurs selon le format
    IF p_format = 'EAN13' THEN
        v_longueur_partielle := 12;
        v_longueur_complete := 13;
    ELSIF p_format = 'EAN8' THEN
        v_longueur_partielle := 7;
        v_longueur_complete := 8;
    ELSIF p_format = 'UPC' THEN
        v_longueur_partielle := 11;
        v_longueur_complete := 12;
    ELSIF p_format = 'ITF14' THEN
        v_longueur_partielle := 13;
        v_longueur_complete := 14;
    ELSE
        -- Format sans chiffre de contrôle
        RETURN p_code;
    END IF;

    -- Si déjà complet, retourner tel quel
    IF length(p_code) = v_longueur_complete THEN
        RETURN p_code;
    END IF;

    -- Si longueur partielle, calculer et ajouter le chiffre de contrôle
    IF length(p_code) = v_longueur_partielle THEN
        v_longueur := length(p_code);

        FOR i IN 1..v_longueur LOOP
            v_chiffres := array_append(v_chiffres, substr(p_code, i, 1)::INTEGER);
        END LOOP;

        FOR i IN 0..(v_longueur - 1) LOOP
            IF i % 2 = 0 THEN
                v_poids := 3;
            ELSE
                v_poids := 1;
            END IF;
            v_somme := v_somme + v_chiffres[v_longueur - i] * v_poids;
        END LOOP;

        v_reste := v_somme % 10;
        IF v_reste = 0 THEN
            v_controle := 0;
        ELSE
            v_controle := 10 - v_reste;
        END IF;

        RETURN p_code || v_controle::TEXT;
    END IF;

    -- Longueur inattendue : retourner tel quel
    RETURN p_code;
END;
$$;

-- ================================
-- PARTIE 34
-- ================================
-- ================================
-- MIGRATION : Compléter les codes-barres existants avec le chiffre de contrôle
-- ================================

-- Fonction utilitaire temporaire pour calculer le chiffre de contrôle
CREATE OR REPLACE FUNCTION public.calculer_chiffre_controle_temp(p_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_chiffres INTEGER[];
    v_longueur INTEGER;
    v_somme INTEGER := 0;
    v_poids INTEGER;
    v_reste INTEGER;
    v_controle INTEGER;
    i INTEGER;
BEGIN
    IF p_code IS NULL OR p_code = '' THEN
        RETURN '';
    END IF;

    -- Vérifier que c'est numérique
    IF p_code !~ '^\d+$' THEN
        RETURN '';
    END IF;

    v_longueur := length(p_code);

    FOR i IN 1..v_longueur LOOP
        v_chiffres := array_append(v_chiffres, substr(p_code, i, 1)::INTEGER);
    END LOOP;

    -- Parcourir de droite à gauche
    FOR i IN 0..(v_longueur - 1) LOOP
        IF i % 2 = 0 THEN
            v_poids := 3;
        ELSE
            v_poids := 1;
        END IF;
        v_somme := v_somme + v_chiffres[v_longueur - i] * v_poids;
    END LOOP;

    v_reste := v_somme % 10;
    IF v_reste = 0 THEN
        v_controle := 0;
    ELSE
        v_controle := 10 - v_reste;
    END IF;

    RETURN v_controle::TEXT;
END;
$$;

-- Compléter les EAN-13 (12 chiffres → 13)
UPDATE public.produits
SET code_barres = code_barres || public.calculer_chiffre_controle_temp(code_barres)
WHERE code_barres IS NOT NULL
AND code_barres ~ '^\d+$'
AND (
    (format_code_barres = 'EAN13' AND length(code_barres) = 12)
);

-- Compléter les EAN-8 (7 chiffres → 8)
UPDATE public.produits
SET code_barres = code_barres || public.calculer_chiffre_controle_temp(code_barres)
WHERE code_barres IS NOT NULL
AND code_barres ~ '^\d+$'
AND (
    (format_code_barres = 'EAN8' AND length(code_barres) = 7)
);

-- Compléter les UPC-A (11 chiffres → 12)
UPDATE public.produits
SET code_barres = code_barres || public.calculer_chiffre_controle_temp(code_barres)
WHERE code_barres IS NOT NULL
AND code_barres ~ '^\d+$'
AND (
    (format_code_barres = 'UPC' AND length(code_barres) = 11)
);

-- Compléter les ITF-14 (13 chiffres → 14)
UPDATE public.produits
SET code_barres = code_barres || public.calculer_chiffre_controle_temp(code_barres)
WHERE code_barres IS NOT NULL
AND code_barres ~ '^\d+$'
AND (
    (format_code_barres = 'ITF14' AND length(code_barres) = 13)
);

-- Faire la même chose pour la colonne "code" si elle contient le même pattern
-- (quand code = code_barres, il faut les synchroniser)
UPDATE public.produits
SET code = code || public.calculer_chiffre_controle_temp(code)
WHERE code IS NOT NULL
AND code ~ '^\d+$'
AND (
    (format_code_barres = 'EAN13' AND length(code) = 12)
    OR (format_code_barres = 'EAN8' AND length(code) = 7)
    OR (format_code_barres = 'UPC' AND length(code) = 11)
    OR (format_code_barres = 'ITF14' AND length(code) = 13)
);

-- Produits sans format_code_barres mais avec un code numérique reconnaissable
-- EAN-13 probable (12 chiffres)
UPDATE public.produits
SET code_barres = code_barres || public.calculer_chiffre_controle_temp(code_barres),
    format_code_barres = 'EAN13'
WHERE code_barres IS NOT NULL
AND code_barres ~ '^\d{12}$'
AND format_code_barres IS NULL;

-- UPC-A probable (11 chiffres)
UPDATE public.produits
SET code_barres = code_barres || public.calculer_chiffre_controle_temp(code_barres),
    format_code_barres = 'UPC'
WHERE code_barres IS NOT NULL
AND code_barres ~ '^\d{11}$'
AND format_code_barres IS NULL;

-- EAN-8 probable (7 chiffres)
UPDATE public.produits
SET code_barres = code_barres || public.calculer_chiffre_controle_temp(code_barres),
    format_code_barres = 'EAN8'
WHERE code_barres IS NOT NULL
AND code_barres ~ '^\d{7}$'
AND format_code_barres IS NULL;

-- Supprimer la fonction temporaire
DROP FUNCTION IF EXISTS public.calculer_chiffre_controle_temp(TEXT);


-- ================================
-- PARTIE 35
-- ================================
-- ================================
-- MISE À JOUR : enregistrer_produit avec complétion du chiffre de contrôle
-- ================================
DROP FUNCTION IF EXISTS public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON);

CREATE OR REPLACE FUNCTION public.enregistrer_produit(
    p_entreprise_id UUID,
    p_nom TEXT,
    p_code TEXT DEFAULT NULL,
    p_code_barres TEXT DEFAULT NULL,
    p_format_code_barres TEXT DEFAULT NULL,
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
    v_pid UUID;
    v_statut TEXT;
    v_emplacement JSON;
    v_utilisateur_id UUID;
    v_result JSON;
    v_qt INTEGER;
    v_qmin INTEGER;
    v_qmax INTEGER;
    v_code_final TEXT;
    v_code_barres_final TEXT;
    v_format TEXT;
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

    v_qt := COALESCE(p_quantite_totale, 0);
    v_qmin := COALESCE(p_quantite_min, 0);
    v_qmax := COALESCE(p_quantite_max, 0);

    IF v_qt <= 0 THEN
        v_statut := 'nul';
    ELSIF v_qmin > 0 AND v_qt < v_qmin THEN
        v_statut := 'faible';
    ELSIF v_qmax > 0 AND v_qt > v_qmax THEN
        v_statut := 'eleve';
    ELSE
        v_statut := 'normal';
    END IF;

    -- Normaliser le format
    v_format := nullif(trim(COALESCE(p_format_code_barres, '')), '');

    -- Compléter le code-barres avec le chiffre de contrôle si nécessaire
    v_code_barres_final := nullif(trim(COALESCE(p_code_barres, '')), '');
    IF v_code_barres_final IS NOT NULL AND v_code_barres_final ~ '^\d+$' AND v_format IS NOT NULL THEN
        v_code_barres_final := public.completer_code_avec_controle(v_code_barres_final, v_format);
    END IF;

    -- Compléter le code produit de la même façon
    v_code_final := nullif(trim(COALESCE(p_code, '')), '');
    IF v_code_final IS NOT NULL AND v_code_final ~ '^\d+$' AND v_format IS NOT NULL THEN
        v_code_final := public.completer_code_avec_controle(v_code_final, v_format);
    END IF;

    INSERT INTO public.produits (
        entreprise_id, nom, code, code_barres, format_code_barres, categorie_id,
        quantite_totale, quantite_min, quantite_max,
        prix_achat, prix_vente, notes, photo_url, statut
    )
    VALUES (
        p_entreprise_id, trim(p_nom),
        v_code_final,
        v_code_barres_final,
        v_format,
        p_categorie_id,
        v_qt, v_qmin, v_qmax,
        COALESCE(p_prix_achat, 0), COALESCE(p_prix_vente, 0),
        nullif(trim(COALESCE(p_notes, '')), ''),
        p_photo_url, v_statut
    );

    v_pid := (
        SELECT pr.id FROM public.produits pr
        WHERE pr.entreprise_id = p_entreprise_id
        AND pr.nom = trim(p_nom)
        ORDER BY pr.cree_le DESC LIMIT 1
    );

    IF p_emplacements IS NOT NULL THEN
        FOR v_emplacement IN SELECT * FROM json_array_elements(p_emplacements)
        LOOP
            INSERT INTO public.emplacements_produit (produit_id, nom, quantite)
            VALUES (
                v_pid,
                trim(COALESCE((v_emplacement->>'nom')::TEXT, '')),
                COALESCE((v_emplacement->>'quantite')::INTEGER, 0)
            );
        END LOOP;
    END IF;

    IF v_statut IN ('nul', 'faible', 'eleve') THEN
        PERFORM public.gerer_notification_stock(
            v_pid, p_entreprise_id, 'normal', v_statut,
            v_qt, v_qmin, v_qmax, trim(p_nom)
        );
    END IF;

    v_result := (
        SELECT row_to_json(pr) FROM public.produits pr WHERE pr.id = v_pid
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.enregistrer_produit(UUID, TEXT, TEXT, TEXT, TEXT, UUID, INTEGER, INTEGER, INTEGER, NUMERIC, NUMERIC, TEXT, TEXT, JSON) TO authenticated;
