import { supabase } from "../../../lib/supabaseClient";

export async function load() {
    const { data } = await supabase.from("countries").select();
    return {
        countries: data ?? [],
    };
}

import type { EntryGenerator } from './$types';

export const entries: EntryGenerator = () => {
	return [
		{ id: '1' }
	];
};

export const prerender = true;