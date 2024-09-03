import axios from "axios";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { useState } from "react";
import "primeicons/primeicons.css";
import "./App.css";

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
  bestDefenseId: number | null;
  highestGoalMatch: {
    player1Id: number;
    player2Id: number;
    score1: number;
    score2: number;
  } | null;
  saldoGols: {
    playerId: number;
    saldo: number;
  }[];
}

function App() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);

  const generateTournament = async () => {
    setLoading(true);
    try {
      const response = await axios.post<Tournament>(
        "http://localhost:3333/tournaments/generate",
        {
          numberOfPlayers: 4,
          tournamentType: "GROUP",
        }
      );
      setTournament(response.data);
    } catch (error) {
      console.error("Erro ao gerar torneio:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (): Statistics => {
    if (!tournament) {
      return {
        topScorerId: null,
        bestDefenseId: null,
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

    // Inicializa as estatísticas
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

    Object.keys(totalScores).forEach((playerId) => {
      const { scored, conceded } = totalScores[parseInt(playerId)];
      if (scored > maxGoals) {
        maxGoals = scored;
        topScorerId = parseInt(playerId);
      }
      if (conceded < minConceded) {
        minConceded = conceded;
        bestDefenseId = parseInt(playerId);
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
      bestDefenseId,
      highestGoalMatch,
      saldoGols,
    };
  };

  const renderTournament = () => {
    if (!tournament) {
      return <p>Ver torneios Antigos</p>;
    }

    switch (tournament.tournamentType) {
      case "ELIMINATORY":
        return renderEliminatory();
      case "GROUP":
        return renderGroup();
      default:
        return <p>Tipo de torneio não suportado.</p>;
    }
  };

  const renderGroup = () => {
    const { champion } = tournament!;
    const { topScorerId, bestDefenseId, highestGoalMatch, saldoGols } =
      calculateStatistics();

    return (
      <div className="tournament-container">
        <h2>Torneio em Grupo</h2>
        <div className="statistics">
          <h3>Classificação</h3>
          <DataTable
            style={{
              overflow: "auto",
              border: "1px solid #ccc",
            }}
            value={saldoGols}
            rows={10}
            rowsPerPageOptions={[5, 10, 20]}
          >
            <Column sortable field="playerId" header="Jogador" />
            <Column sortable field="pontos" header="Pontos" />
            <Column sortable field="saldo" header="Saldo" />
            <Column sortable field="vitorias" header="Vitórias" />
            <Column sortable field="empates" header="Empates" />
            <Column sortable field="derrotas" header="Derrotas" />
          </DataTable>
        </div>
        <div className="matches">
          <h3>Resultados dos Jogos</h3>
          {tournament!.matches.map((match, index) => (
            <div key={index} className="match">
              <div className="team">
                <div className="team-name">Jogador {match.player1Id}</div>
                <div
                  className={`score ${
                    match.score1 && match.score2
                      ? match.score1 > match.score2
                        ? "winner"
                        : match.score1 < match.score2
                        ? "loser"
                        : "draw"
                      : ""
                  }`}
                >
                  {match.score1 || 0}
                </div>
              </div>
              <div className="team">
                <div className="team-name">Jogador {match.player2Id}</div>
                <div
                  className={`score ${
                    match.score1 && match.score2
                      ? match.score2 > match.score1
                        ? "winner"
                        : match.score2 < match.score1
                        ? "loser"
                        : "draw"
                      : ""
                  }`}
                >
                  {match.score2 || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
        <h3>Campeão: Jogador {champion}</h3>
        <div className="statistics">
          <h3>Estatísticas</h3>
          <p>Artilheiro: Jogador {topScorerId}</p>
          <p>Melhor Defesa: Jogador {bestDefenseId}</p>
          {highestGoalMatch && (
            <p>
              Maior Goleada: Jogador {highestGoalMatch.player1Id}{" "}
              {highestGoalMatch.score1} x {highestGoalMatch.score2} Jogador{" "}
              {highestGoalMatch.player2Id}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderEliminatory = () => {
    const matchesByRound: { [round: number]: Match[] } =
      tournament!.matches.reduce(
        (acc: { [round: number]: Match[] }, match: Match) => {
          if (!acc[match.round]) {
            acc[match.round] = [];
          }
          acc[match.round].push(match);
          return acc;
        },
        {}
      );

    const championId = tournament!.champion;
    const { topScorerId, bestDefenseId, highestGoalMatch, saldoGols } =
      calculateStatistics();

    return (
      <div className="tournament-container">
        <h2>Chaves Eliminatórias</h2>
        {Object.keys(matchesByRound).map((round) => (
          <div key={round} className="round">
            <h3>Rodada {round}</h3>
            {matchesByRound[parseInt(round)].map(
              (match: Match, index: number) => (
                <div key={index} className="match">
                  <div className="team">
                    <div className="team-name">Jogador {match.player1Id}</div>
                    <div
                      className={`score ${
                        match.score1 && match.score2
                          ? match.score1 > match.score2
                            ? "winner"
                            : match.score1 < match.score2
                            ? "loser"
                            : "draw"
                          : ""
                      }`}
                    >
                      {match.score1 || 0}
                    </div>
                  </div>
                  <div className="team">
                    <div className="team-name">Jogador {match.player2Id}</div>
                    <div
                      className={`score ${
                        match.score1 && match.score2
                          ? match.score2 > match.score1
                            ? "winner"
                            : match.score2 < match.score1
                            ? "loser"
                            : "draw"
                          : ""
                      }`}
                    >
                      {match.score2 || 0}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        ))}
        <h3>Campeão: Jogador {championId}</h3>
        <div className="statistics">
          <h3>Estatísticas</h3>
          <p>Artilheiro: Jogador {topScorerId}</p>
          <p>Melhor Defesa: Jogador {bestDefenseId}</p>
          {highestGoalMatch && (
            <p>
              Maior Goleada: Jogador {highestGoalMatch.player1Id}{" "}
              {highestGoalMatch.score1} x {highestGoalMatch.score2} Jogador{" "}
              {highestGoalMatch.player2Id}
            </p>
          )}
        </div>
        <div className="statistics">
          <h4>Saldo de Gols</h4>
          <DataTable
            style={{
              width: "100%",
              overflow: "auto",
              border: "1px solid #ccc",
            }}
            value={saldoGols}
            rows={10}
            rowsPerPageOptions={[5, 10, 20]}
          >
            <Column sortable field="playerId" header="Jogador" />
            <Column sortable field="saldo" header="Saldo de Gols" />
          </DataTable>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Gerador de Torneios</h1>
        <Button
          label="Gerar Torneio"
          onClick={generateTournament}
          loading={loading}
        />
        {renderTournament()}
      </div>
    </div>
  );
}

export default App;
