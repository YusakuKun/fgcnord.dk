/**
 * Feature flags — én kontakt pr. eksperiment (samme mønster som
 * KONAMI_ENABLED i KonamiEgg.tsx).
 *
 * TEST_EVENT_ENABLED styrer Bjergtop 3-testsiden på /test.
 * Slå til (true) for at udvikle/teste eventsider lokalt eller live,
 * slå fra (false) når siden ikke må være synlig — ruten redirecter
 * så til forsiden.
 */
export const TEST_EVENT_ENABLED = false;
