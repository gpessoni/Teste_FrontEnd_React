import axios from "axios";
import "primeicons/primeicons.css";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { ConfirmDialog } from "primereact/confirmdialog";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputNumber } from "primereact/inputnumber";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { calculateStatistics } from "./components/CalculateStatistics";
import StatisticsComponent from "./components/StatisticsComponent";

interface Match {
  player1Id: number;
  player2Id: number;
  score1?: number;
  score2?: number;
  round: number;
}

interface Tournament {
  tournamentId?: number | null;
  matches: Match[];
  champion: number;
  tournamentType: string;
}

function App() {
  const apiUrl = process.env.VITE_SOME_KEY;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [tournamentType, setTournamentType] = useState("");
  const [numberOfTeams, setNumberOfTeams] = useState();

  const [oldTournaments, setOldTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] =
    useState<Tournament | null>(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogNewVisible, setDialogNewVisible] = useState(false);

  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState(false);

  const toast = useRef<Toast>(null);

  const tournamentTypes = [
    { label: "Grupo", value: "GROUP" },
    { label: "Eliminatório", value: "ELIMINATORY" },
  ];

  const generateTournament = async () => {
    if (
      numberOfTeams === undefined ||
      numberOfTeams === 0 ||
      numberOfTeams === null ||
      tournamentType === ""
    ) {
      if (toast.current) {
        toast.current.show({
          severity: "error",
          summary: "Erro",
          detail: "Preencha todos os campos",
        });
      }
      return;
    }

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
        `${apiUrl}/tournaments/generate`,
        {
          numberOfPlayers: adjustedNumberOfTeams,
          tournamentType,
        }
      );
      setTournament(response.data);
      setDialogVisible(false);
      setDialogNewVisible(false);
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

  const deleteTournament = async () => {
    if (!selectedTournament) {
      return;
    }
    setLoading(true);
    try {
      await axios.delete(
        `${apiUrl}/tournaments/${selectedTournament.tournamentId}`
      );

      if (toast.current) {
        toast.current.show({
          severity: "success",
          summary: "Sucesso",
          detail: "Torneio deletado com sucesso.",
        });
      }

      setOldTournaments((prevTournaments) =>
        prevTournaments.filter(
          (tournament) =>
            tournament.tournamentId !== selectedTournament.tournamentId
        )
      );
    } catch (error: any) {
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

  const fetchOldTournaments = async () => {
    try {
      const response = await axios.get<Tournament[]>(`${apiUrl}/tournaments`);
      setOldTournaments(response.data);
    } catch (error) {
      console.error("Erro ao buscar torneios antigos:", error);
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

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setTournament(tournament);
    setDialogVisible(false);
    setDialogVisible(false);
    renderTournament();
  };

  useEffect(() => {
    if (dialogVisible) {
      fetchOldTournaments();
    }
  }, [dialogVisible]);

  return (
    <>
      <div className="App">
        <div className="container">
          <Toast ref={toast} />
          <h1>Gerador de Torneios</h1>
          <Button
            className="button"
            label="Gerar Torneio"
            onClick={() => setDialogNewVisible(true)}
            loading={loading}
          />
          <br /> <br />
          <Button
            className="button"
            label="Ver Torneios Antigos"
            icon="pi pi-calendar"
            onClick={() => setDialogVisible(true)}
          />
          {renderTournament()}
        </div>
      </div>
      <Dialog
        draggable={false}
        header="Configurações do Torneio"
        visible={dialogNewVisible}
        style={{ width: "50vw" }}
        modal
        closable
        closeIcon="pi pi-times"
        closeOnEscape={true}
        className="p-fluid"
        onHide={() => setDialogNewVisible(false)}
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
              placeholder="Número de Times"
              value={numberOfTeams}
              onValueChange={(e) => setNumberOfTeams(e.value)}
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

      <Dialog
        draggable={false}
        header="Selecionar Torneio Antigo"
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
          <h3>Escolha um Torneio</h3>
          <DataTable
            value={oldTournaments}
            rows={10}
            rowsPerPageOptions={[5, 10, 20]}
            selectionMode="single"
            selection={selectedTournament}
          >
            <Column field="tournamentName" header="Nome" />
            <Column field="tournamentType" header="Tipo" />
            <Column
              body={(rowData) => (
                <Button
                  icon="pi pi-eye"
                  onClick={() => handleTournamentSelect(rowData)}
                />
              )}
            />
            <Column
              body={(rowData) => (
                <Button
                  style={{
                    backgroundColor: "red",
                  }}
                  icon="pi pi-trash"
                  onClick={() => {
                    setSelectedTournament(rowData);
                    setConfirmDeleteDialog(true);
                  }}
                />
              )}
            />
          </DataTable>
        </div>
      </Dialog>

      <ConfirmDialog
        header="Excluir Torneio"
        visible={confirmDeleteDialog}
        closeIcon="pi pi-times"
        onHide={() => setConfirmDeleteDialog(false)}
        acceptLabel="Sim"
        rejectLabel="Não"
        acceptIcon="pi pi-trash"
        accept={() => deleteTournament()}
        rejectIcon="pi pi-times"
        message={`Deseja excluir o torneio ?`}
        className="p-dialog-centered"
      ></ConfirmDialog>
    </>
  );
}

export default App;
