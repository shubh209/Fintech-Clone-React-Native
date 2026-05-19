# Backend Domain Folder Structure

Backend code will be organized by domain folders instead of flat technical folders. The current crypto API should move toward `apps/backend/src/domains/crypto-market/`, with routes, services, providers, and fallback-store code grouped under the domain that owns the behavior.

This introduces more structure than the backend strictly needs today, but it gives future historical pricing and purchasing-power APIs clear homes without mixing every route, service, client, and store in global technical folders.
