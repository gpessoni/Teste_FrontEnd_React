import axios from "axios";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import "primereact/resources/themes/lara-light-cyan/theme.css";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import "./App.css";
import StatisticsComponent from "./components/StatisticsComponent";
import { calculateStatistics } from "./components/CalculateStatistics";

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

function App() {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [tournamentType, setTournamentType] = useState("GROUP");
  const [numberOfTeams, setNumberOfTeams] = useState(4);

  const toast = useRef<Toast>(null);

  const tournamentTypes = [
    { label: "Grupo", value: "GROUP" },
    { label: "Eliminatório", value: "ELIMINATORY" },
  ];

  const generateTournament = async () => {
    setLoading(true);
    try {
      if (tournamentType === "ELIMINATORY" && !isPowerOfTwo(numberOfTeams)) {
        throw new Error(
          "A quantidade de times deve ser uma potência de 2 para torneios eliminatórios."
        );
      }

      const adjustedNumberOfTeams =
        tournamentType === "ELIMINATORY"
          ? Math.pow(2, Math.ceil(Math.log2(numberOfTeams)))
          : numberOfTeams;

      const response = await axios.post<Tournament>(
        "http://localhost:3333/tournaments/generate",
        {
          numberOfPlayers: adjustedNumberOfTeams,
          tournamentType,
        }
      );
      setTournament(response.data);
      setDialogVisible(false);
    } catch (error: any) {
      console.error("Erro ao gerar torneio:", error);
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isPowerOfTwo = (n: number): boolean => {
    return n > 0 && (n & (n - 1)) === 0;
  };

  const ChampionHeader = ({ champion }: { champion: number }) => (
    <div className="champion">
      <h3>Campeão: Jogador {champion}</h3>
    </div>
  );

  const renderTournament = () => {
    if (!tournament) {
      return <p></p>;
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
    const {
      topScorerId,
      bestDefenseId,
      highestGoalMatch,
      saldoGols,
      topScorerGoals,
      bestDefenseConceded,
    } = calculateStatistics(tournament);

    return (
      <>
        <Toast ref={toast} />
        <hr />
        <div className="tournament-container">
          <h2>Torneio em Grupo</h2>
          <ChampionHeader champion={champion} />
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

          <StatisticsComponent
            topScorerId={topScorerId}
            topScorerGoals={topScorerGoals}
            bestDefenseId={bestDefenseId}
            bestDefenseConceded={bestDefenseConceded}
            highestGoalMatch={highestGoalMatch}
          />
        </div>
      </>
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

    const champion = tournament!.champion;
    const {
      topScorerId,
      bestDefenseId,
      highestGoalMatch,
      saldoGols,
      bestDefenseConceded,
      topScorerGoals,
    } = calculateStatistics(tournament);

    return (
      <>
        <hr />
        <div className="tournament-container">
          <h2>Chaves Eliminatórias</h2>
          <ChampionHeader champion={champion} />
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

          <StatisticsComponent
            topScorerId={topScorerId}
            topScorerGoals={topScorerGoals}
            bestDefenseId={bestDefenseId}
            bestDefenseConceded={bestDefenseConceded}
            highestGoalMatch={highestGoalMatch}
          />
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
      </>
    );
  };

  return (
    <>
      <div className="App">
        <div className="container">
          <Toast ref={toast} />
          <h1>Gerador de Torneios</h1>
          <Button
            label="Gerar Torneio"
            onClick={() => setDialogVisible(true)}
            loading={loading}
          />
          <br /> <br />
          <p>Ver torneios Antigos</p>
          {renderTournament()}
        </div>
      </div>
      <Dialog
        draggable={false}
        header="Configurações do Torneio"
        visible={dialogVisible}
        style={{ width: "50vw" }}
        modal
        closable
        closeIcon="pi pi-times"
        closeOnEscape={true}
        className="p-fluid"
        onHide={() => setDialogVisible(false)}
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="tournamentType">Tipo de Torneio</label>
            <Dropdown
              id="tournamentType"
              value={tournamentType}
              options={tournamentTypes}
              onChange={(e) => setTournamentType(e.value)}
              optionLabel="label"
              placeholder="Selecione o tipo de torneio"
            />
          </div>
          <div
            className="p-field"
            style={{
              marginTop: 20,
            }}
          >
            <label htmlFor="numberOfTeams">Número de Times</label>
            <InputNumber
              id="numberOfTeams"
              value={numberOfTeams}
              onValueChange={(e) => setNumberOfTeams(e.value || 4)}
              min={2}
              max={64}
              step={1}
            />
          </div>
          <Button
            label="Gerar"
            icon="pi pi-check"
            className="p-button-success"
            onClick={generateTournament}
            style={{
              marginTop: 20,
            }}
          />
        </div>
      </Dialog>
    </>
  );
}

export default App;
