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

export default function StatisticsComponent({
  topScorerId,
  topScorerGoals,
  bestDefenseId,
  bestDefenseConceded,
  highestGoalMatch,
}: Statistics) {
  return (
    <div className="statistics">
      <h3>Estatísticas</h3>
      <p>
        Artilheiro: Jogador {topScorerId} - {topScorerGoals} gols feitos
      </p>
      <p>
        Melhor Defesa: Jogador {bestDefenseId} - {bestDefenseConceded} gols
        sofridos
      </p>
      {highestGoalMatch && (
        <p>
          Maior Goleada: Jogador {highestGoalMatch.player1Id}{" "}
          {highestGoalMatch.score1} x {highestGoalMatch.score2} Jogador{" "}
          {highestGoalMatch.player2Id}
        </p>
      )}
    </div>
  );
}
