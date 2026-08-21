# Mesurer la latence MIDI

Le budget visé est de **20 ms** entre le geste et le son. Ce document dit
comment le mesurer, et surtout comment ne pas se tromper de grandeur.

Mesuré le 2026-08-21 sur un ThinkPad E14 Gen6, EP‑133 en USB.

---

## Ce qui se décompose

| Segment | Mesurable comment | Valeur |
|---|---|---|
| Machine → pilote ALSA | cadence connue, horodatage à l'arrivée | ~1 ms (borne haute) |
| ALSA → navigateur | `performance.now()` dans `onmidimessage` | ⬜ |
| Navigateur → son | horloge Web Audio | ⬜ |

Seul le premier segment est mesuré. **Ne pas présenter le plancher système
comme la latence de l'application** : c'est son dénominateur, pas son total.

---

## Plancher système

L'idée : émettre une cadence dont on connaît l'intervalle exact, l'horodater à
l'arrivée, et regarder non pas le retard — inconnaissable sans référence
absolue — mais la **régularité**. C'est la gigue qui gêne un musicien, pas un
décalage constant.

### Générer la cadence

```python
import struct
div, tempo = 480, 500000          # ticks/noire, µs/noire
ticks = 96                         # 100 ms
ev = bytearray()
def vlq(n):
    b=[n&0x7f]; n>>=7
    while n: b.append((n&0x7f)|0x80); n>>=7
    return bytes(reversed(b))
ev += vlq(0) + b'\xff\x51\x03' + tempo.to_bytes(3,'big')
for i in range(60):
    ev += vlq(0 if i==0 else ticks) + bytes([0x90, 60, 100])
    ev += vlq(10) + bytes([0x80, 60, 0])
ev += vlq(0) + b'\xff\x2f\x00'
open('cadence.mid','wb').write(
    b'MThd' + struct.pack('>IHHH',6,0,1,div) +
    b'MTrk' + struct.pack('>I',len(ev)) + bytes(ev))
```

> ⚠️ **Le piège du nominal.** Le note-off intercalé vaut 10 ticks. L'intervalle
> entre deux note-on est donc `10 + 96 = 106` ticks, soit **110,42 ms**, et non
> 100. Comparer la mesure à 100 ms fait apparaître une dérive fantôme de 10 ms
> qui n'existe pas. C'est arrivé à la première lecture des résultats.

### Capturer et mesurer

```bash
timeout 12 aseqdump -p 14:0 | python3 -u -c '
import sys,time
for l in sys.stdin:
    if "Note on" in l: print(f"{time.perf_counter():.6f}", flush=True)
' > arrivees.txt &
sleep 1
aplaymidi -p 14:0 cadence.mid
```

Puis l'écart-type des intervalles successifs.

### Résultat

```
moyenne mesurée   110,42 ms   (0,01 ms du nominal)
écart-type          0,53 ms   ← la gigue
pire écart          1,02 ms
amplitude           1,85 ms
```

**Borne haute** : la boucle de mesure lance un processus par événement, son
coût est inclus. La gigue réelle d'ALSA est en dessous.

Conclusion : le système consomme ~1 ms du budget. Les 19 autres sont pour le
navigateur et l'application.

---

## Segment application — à faire

Il faut le navigateur et quelqu'un qui joue. Deux horloges à relever dans
`onmidimessage` :

- `event.timeStamp` — quand le navigateur dit avoir reçu le message
- `performance.now()` à l'entrée du gestionnaire — quand on le traite

Leur écart est le temps passé dans la file du navigateur. Puis l'écart entre
ce dernier et l'instant programmé sur `AudioContext.currentTime` donne la part
de l'application.

Le rack porte déjà de quoi l'afficher : `RackDiagnostic` a un champ
« DERNIER MSG », et il se met à jour par référence impérative sans re-rendre
le rack — donc sans fausser la mesure.

---

## Vérifier que la machine émet

```bash
amidi -l                        # la machine doit apparaître
timeout 10 aseqdump -p 28:0     # 28 = client EP-133, cf. aconnect -l
```

L'EP‑133 a été vue émettant des notes de pads (42, 45, 46, 47) le 2026-08-21 :
le chemin de capture fonctionne. Une fenêtre vide signifie que personne ne
jouait, pas que le lien est rompu — le vérifier avec `amidi -p hw:3,0,0 -S FE`,
qui doit être accepté.

## L'OP‑1 n'a pas de port MIDI en mode disque

C'est normal, pas une panne. En mode disque, l'appareil ne présente qu'une
interface *Mass Storage* :

```bash
lsusb -v -d 2367:0002 | grep bInterfaceClass    # → 8 Mass Storage
```

Il faut le basculer en mode contrôleur pour qu'un port MIDI apparaisse. Les
deux modes s'excluent.
