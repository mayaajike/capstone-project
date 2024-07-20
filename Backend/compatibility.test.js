const { getCompatibilityScore } = require('./utils');

jest.mock('./utils', () => {
    const originalModule = jest.requireActual('./utils');
    return {
        __esModule: true,
        ...originalModule,
        calcJaccardIndex: jest.requireActual('./utils').calcJaccardIndex,
        calcTopGenresJaccard: jest.requireActual('./utils').calcTopGenresJaccard,
        calcCosineSimilarity: jest.requireActual('./utils').calcCosineSimilarity,
        calcCompatibility: jest.requireActual('./utils').calcCompatibility
    }
});

describe('getCompatibilityScore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetAllMocks();
    });

    test('when compatibility is 100', () => {
        const score = getCompatibilityScore(
            [{ name: 'song1', popularity: 50 }, { name: 'song2', popularity: 60 }],
            [{ name: 'song1', popularity: 50 }, { name: 'song2', popularity: 60 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist2', popularity: 70 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist2', popularity: 70 }],
            [{ name: 'artist1', popularity: 65 }],
            [{ name: 'artist1', popularity: 65 }],
            [{ name: 'song1', popularity: 50 }],
            [{ name: 'song1', popularity: 50 }],
            new Set(['genre1', 'genre2']),
            new Set(['genre1', 'genre2']),
            { danceability: 1.0, loudness: -5.0, energy: 1.0, tempo: 120.0, valence: 1.0, duration_ms: 180000 },
            { danceability: 1.0, loudness: -5.0, energy: 1.0, tempo: 120.0, valence: 1.0, duration_ms: 180000 }
        );
        expect(score).toBe(100);
    });

    test('when compatibility is 0', () => {
        const score = getCompatibilityScore(
            [{ name: 'song1', popularity: 50 }, { name: 'song2', popularity: 60 }],
            [{ name: 'song3', popularity: 70 }, { name: 'song4', popularity: 80 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist2', popularity: 70 }],
            [{ name: 'artist3', popularity: 75 }, { name: 'artist4', popularity: 80 }],
            [{ name: 'artist1', popularity: 65 }],
            [{ name: 'artist2', popularity: 75 }],
            [{ name: 'song1', popularity: 50 }],
            [{ name: 'song2', popularity: 70 }],
            new Set(['genre1', 'genre2']),
            new Set(['genre3', 'genre4']),
            { danceability: 1.0, loudness: -5.0, energy: 1.0, tempo: 120.0, valence: 1.0, duration_ms: 180000 },
            { danceability: 0.0, loudness: -30.0, energy: 0.0, tempo: 60.0, valence: 0.0, duration_ms: 300000 }
        );
        expect(score).toBe(60);
    });

    test('when a user has no followed artists', () => {
        const score = getCompatibilityScore(
            [{ name: 'song1', popularity: 50 }, { name: 'song2', popularity: 60 }],
            [{ name: 'song1', popularity: 50 }, { name: 'song2', popularity: 60 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist2', popularity: 70 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist2', popularity: 70 }],
            [],
            [{ name: 'artist1', popularity: 65 }],
            [{ name: 'song1', popularity: 50 }],
            [{ name: 'song1', popularity: 50 }],
            new Set(['genre1', 'genre2']),
            new Set(['genre1', 'genre2']),
            { danceability: 1.0, loudness: -5.0, energy: 1.0, tempo: 120.0, valence: 1.0, duration_ms: 180000 },
            { danceability: 1.0, loudness: -5.0, energy: 1.0, tempo: 120.0, valence: 1.0, duration_ms: 180000 }
        );
        expect(score).toBe(92);
    });

    test('when audio features are very opposite', () => {
        const score = getCompatibilityScore(
            [{ name: 'song1', popularity: 50 }, { name: 'song2', popularity: 60 }],
            [{ name: 'song1', popularity: 50 }, { name: 'song3', popularity: 75 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist2', popularity: 70 }],
            [{ name: 'artist2', popularity: 70 }, { name: 'artist3', popularity: 45 }],
            [{ name: 'artist1', popularity: 65 }],
            [{ name: 'artist3', popularity: 45 }],
            [{ name: 'song1', popularity: 50 }],
            [{ name: 'song3', popularity: 75 }],
            new Set(['genre1', 'genre2']),
            new Set(['genre3', 'genre4']),
            { danceability: 1.0, loudness: -5.0, energy: 1.0, tempo: 120.0, valence: 1.0, duration_ms: 180000 },
            { danceability: 0.0, loudness: -30.0, energy: 0.0, tempo: 60.0, valence: 0.0, duration_ms: 300000 }
        );
        expect(score).toBe(64.8);
    });

    test('when compatibility is average', () => {
        const score = getCompatibilityScore(
            [{ name: 'song1', popularity: 45 }, { name: 'song2', popularity: 60 }],
            [{ name: 'song3', popularity: 50 }, { name: 'song4', popularity: 70 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist2', popularity: 70 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist3', popularity: 75 }],
            [{ name: 'artist1', popularity: 65 }],
            [{ name: 'artist2', popularity: 75 }],
            [{ name: 'song1', popularity: 50 }],
            [{ name: 'song2', popularity: 70 }],
            new Set(['genre1', 'genre2']),
            new Set(['genre1', 'genre3']),
            { danceability: 0.7, loudness: -10.0, energy: 0.7, tempo: 110.0, valence: 0.7, duration_ms: 200000 },
            { danceability: 0.5, loudness: -15.0, energy: 0.5, tempo: 100.0, valence: 0.5, duration_ms: 210000 }
          );
          expect(score).toBe(66.7);
    });

    test('when a user has no liked songs', () => {
        const score = getCompatibilityScore(
            [{ name: 'song1', popularity: 50 }, { name: 'song2', popularity: 60 }],
            [{ name: 'song1', popularity: 50 }, { name: 'song2', popularity: 60 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist2', popularity: 70 }],
            [{ name: 'artist1', popularity: 65 }, { name: 'artist2', popularity: 70 }],
            [{ name: 'artist2', popularity: 55 }],
            [{ name: 'artist1', popularity: 65 }],
            [{ name: 'song1', popularity: 50 }],
            [],
            new Set(['genre1', 'genre2']),
            new Set(['genre1', 'genre2']),
            { danceability: 1.0, loudness: -5.0, energy: 1.0, tempo: 120.0, valence: 1.0, duration_ms: 180000 },
            { danceability: 1.0, loudness: -5.0, energy: 1.0, tempo: 120.0, valence: 1.0, duration_ms: 180000 }
        );
        expect(score).toBe(84);
    });
})
