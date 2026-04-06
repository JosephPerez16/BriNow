// FIXED modMap error
function buildInstruction(step){
  const maneuver=step.maneuver||{};
  const type=maneuver.type||"continue";
  const modifier=maneuver.modifier||"";
  const road=step.name?` por ${step.name}`:"";
  const map={
    continue:"Sigue recto",
    depart:"Sal",
    turn:"Gira",
    merge:"Incorpórate",
    on_ramp:"Toma la entrada",
    off_ramp:"Toma la salida",
    fork:"Mantente",
    roundabout:"Entra en la rotonda",
    arrive:"Llegaste al destino"
  };
  let text=map[type]||"Continúa";
  if(modifier){
    const modMap={
      left:"a la izquierda",
      right:"a la derecha",
      straight:"recto",
      "slight left":"ligeramente a la izquierda",
      "slight right":"ligeramente a la derecha",
      "sharp left":"fuerte a la izquierda",
      "sharp right":"fuerte a la derecha",
      uturn:"en U"
    };
    text+=` ${modMap[modifier]||modifier}`;
  }
  return `${text}${road}`.trim();
}
