interface Match {
  player1Id: number;
  player2Id: number;
  score1?: number;
  score2?: number;
  round: number;
}

interface Tournament {
  matches: Match[];
  champion: number;
  tournamentType: string;
}

interface TeamStats {
  scored: number;
  conceded: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
}
interface Statistics {
  topScorerId: number | null;
  topScorerGoals: number | null;
  bestDefenseConceded: number | null;
  bestDefenseId: number | null;
  highestGoalMatch: {
    player1Id: number;
    player2Id: number;
    score1: number;
    score2: number;
  } | null;
  saldoGols?: {
    playerId: number;
    saldo: number;
  }[];
}

export const calculateStatistics = (
  tournament: Tournament | null
): Statistics => {
  if (!tournament) {
    return {
      topScorerId: null,
      topScorerGoals: 0,
      bestDefenseId: null,
      bestDefenseConceded: 0,
      highestGoalMatch: null,
      saldoGols: [],
    };
  }

  let totalScores: { [key: number]: TeamStats } = {};
  let highestGoalDifference = -1;
  let highestGoalMatch: {
    player1Id: number;
    player2Id: number;
    score1: number;
    score2: number;
  } | null = null;

  tournament.matches.forEach((match: Match) => {
    const { player1Id, player2Id, score1 = 0, score2 = 0 } = match;

    if (!totalScores[player1Id])
      totalScores[player1Id] = {
        scored: 0,
        conceded: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
      };
    if (!totalScores[player2Id])
      totalScores[player2Id] = {
        scored: 0,
        conceded: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
      };

    totalScores[player1Id].scored += score1;
    totalScores[player1Id].conceded += score2;
    totalScores[player2Id].scored += score2;
    totalScores[player2Id].conceded += score1;

    if (score1 > score2) {
      totalScores[player1Id].wins += 1;
      totalScores[player2Id].losses += 1;
      totalScores[player1Id].points += 3;
    } else if (score2 > score1) {
      totalScores[player2Id].wins += 1;
      totalScores[player1Id].losses += 1;
      totalScores[player2Id].points += 3;
    } else {
      totalScores[player1Id].draws += 1;
      totalScores[player2Id].draws += 1;
      totalScores[player1Id].points += 1;
      totalScores[player2Id].points += 1;
    }

    const goalDifference = Math.abs(score1 - score2);
    if (goalDifference > highestGoalDifference) {
      highestGoalDifference = goalDifference;
      highestGoalMatch = { player1Id, player2Id, score1, score2 };
    }
  });

  let topScorerId: number | null = null;
  let bestDefenseId: number | null = null;
  let maxGoals = -1;
  let minConceded = Infinity;
  let topScorerGoals = 0;
  let bestDefenseConceded = 0;

  Object.keys(totalScores).forEach((playerId) => {
    const { scored, conceded } = totalScores[parseInt(playerId)];
    if (scored > maxGoals) {
      maxGoals = scored;
      topScorerId = parseInt(playerId);
      topScorerGoals = scored;
    }
    if (conceded < minConceded) {
      minConceded = conceded;
      bestDefenseId = parseInt(playerId);
      bestDefenseConceded = conceded;
    }
  });

  const saldoGols = Object.keys(totalScores).map((playerId) => {
    const { scored, conceded, wins, draws, losses, points } =
      totalScores[parseInt(playerId)];
    return {
      playerId: parseInt(playerId),
      saldo: scored - conceded,
      pontos: points,
      vitorias: wins,
      empates: draws,
      derrotas: losses,
    };
  });

  saldoGols.sort((a, b) => b.pontos - a.pontos || b.saldo - a.saldo);

  return {
    topScorerId,
    topScorerGoals,
    bestDefenseId,
    bestDefenseConceded,
    highestGoalMatch,
    saldoGols,
  };
};
