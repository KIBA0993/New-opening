import "server-only";
import { isAdmin } from "./admin";
import { paidSession } from "./billing";
import { industryBySlug } from "./industries";
import { getPlace } from "./providers/places";
import type { IndustrySlug, OwnerProfile } from "./types";

/**
 * Who may read or change a Kit's progress: the buyer (the paid checkout session id is the key to
 * their Kit), or the admin for "preview:<placeId>|<industry>" kits on /admin/kit.
 */
export async function kitOwner(storeKey: string): Promise<OwnerProfile | null> {
  if (storeKey.startsWith("preview:")) {
    if (!(await isAdmin())) return null;
    const [placeId, ind] = storeKey.slice("preview:".length).split("|");
    const place = await getPlace(placeId);
    if (!place) return null;
    return {
      placeId: place.id,
      name: place.name,
      address: place.address,
      city: place.city || place.address,
      phone: place.phone,
      website: place.website,
      industry: (industryBySlug(ind)?.slug || "home-services") as IndustrySlug,
      managesProfile: "unsure",
      services: "",
      different: "",
      areas: "",
      email: "",
    };
  }
  return (await paidSession(storeKey))?.profile || null;
}
