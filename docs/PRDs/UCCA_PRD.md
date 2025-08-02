Algorithm 1 PRD for UCCA implementation into webapp

<Algorithm1>
 1. Algorithm 1: UCCA Identification
 2.  
 3. Input: A, C^int, S
 4. Output: U^abs, U^ref sets of UCCAs, abstracted & refined (Tuple)
 5. // A: what controller can provide what control action (Tuple)
 6. // C^int: set of interchangeable controllers (Set)
 7. // S: special interactions to consider in refinement (Tuple)
 8.  
 9. 1. C^abs ← Enumerate-Combinations(A) // [Table 4-14]*
10. 2. for x ∈ C^abs**
11. 3.     if Context(C_x^abs) ≠ ∅**
12. 4.         U^abs = U^abs ∪ (C_x^abs, context_x, U_x^rel)**
13. 5. for x ∈ U^abs*
14. 6.     C_x^ref ← Refine-Combinations(U_x^abs, A, S) // [Equation (17)]*
15. 7.     C_x^ref' ← Prune-Equivalent(C_x^ref, C^int) // [Equation (21)]*
16. 8.     U_x^ref ← Prioritize(C_x^ref', S) // [Heuristic, see discussion]*
17. 9. return (U^abs, U^ref)*
18.  
19. // * Step automated; ** Step performed by human
</Algorithm1>

From now on we will go section by section through <algorithm1> and describe the pseudocode and information pertaining to it.

<Line_1>
<Info>
1. C^abs ← Enumerate-Combinations(A) // [Table 4-14]*
</Info>

<Pseudocode>
 1. FUNCTION Enumerate-Combinations(A)
 2.     combinations = ∅
 3.     N = A.Controllers  // vector of controllers
 4.     M = A.ControlActions  // vector of control actions
 5.     
 6.     // Abstraction 2a Type 1-2
 7.     FOR EACH u_a ∈ M
 8.         FOR EACH u_b ∈ M WHERE b ≠ a
 9.             combinations.add({
10.                 a. ¬u_a ∧ ¬∃u_b
11.                 b. ¬u_a ∧ ∃u_b
12.                 c. u_a ∧ ¬∃u_b
13.                 d. u_a ∧ ∃u_b
14.             } given U_a(c_N), U_b(c_N))
15.         END FOR
16.     END FOR
17.     
18.     // Abstraction 2b Type 1-2
19.     FOR EACH u_a ∈ M
20.         FOR EACH c_i ∈ N
21.             combinations.add({
22.                 a. ¬U_a(c_i) ∧ ¬∃c_j U_a(c_j)
23.                 b. U_a(c_i) ∧ ¬∃c_j U_a(c_j)
24.                 c. U_a(c_i) ∧ ∃c_j U_a(c_j)
25.             } given i ≠ j ∈ N)
26.         END FOR
27.     END FOR
28.     
29.     // Abstraction 2a Type 3-4 (LTL temporal patterns)
30.     FOR EACH u_a ∈ M
31.         FOR EACH u_b ∈ M WHERE b ≠ a
32.             combinations.add({
33.                 a. ∃u_b[(¬u_a ∧ ¬u_b) U (u_a ∧ ¬u_b) F u_b]
34.                 b. ∃u_b[(¬u_a ∧ u_b) U (u_a ∧ u_b) F ¬u_b]
35.                 c. ∃u_b[(u_a ∧ ¬u_b) U (¬u_a ∧ ¬u_b) F u_b]
36.                 d. ∃u_b[(u_a ∧ u_b) U (¬u_a ∧ u_b) F ¬u_b]
37.                 e. ∃u_b[(¬u_a ∧ ¬u_b) U (¬u_a ∧ u_b) F u_a]
38.                 f. ∃u_b[(¬u_a ∧ u_b) U (¬u_a ∧ ¬u_b) F u_a]
39.                 g. ∃u_b[(u_a ∧ ¬u_b) U (u_a ∧ u_b) F ¬u_a]
40.                 h. ∃u_b[(u_a ∧ u_b) U (u_a ∧ ¬u_b) F ¬u_a]
41.             } given U_a(c_N), U_b(c_N))
42.         END FOR
43.     END FOR
44.     
45.     // Abstraction 2b Type 3-4
46.     FOR EACH u_a ∈ M
47.         FOR EACH c_i ∈ N
48.             combinations.add({
49.                 a. (¬U_a(c_i) ∧ ¬U_a(c_j)) U (U_a(c_i) ∧ ¬U_a(c_j)) F U_a(c_j)
50.                 b. (¬U_a(c_i) ∧ U_a(c_j)) U (U_a(c_i) ∧ U_a(c_j)) F ¬U_a(c_j)
51.                 c. (U_a(c_i) ∧ ¬U_a(c_j)) U (¬U_a(c_i) ∧ ¬U_a(c_j)) F U_a(c_j)
52.                 d. (U_a(c_i) ∧ U_a(c_j)) U (¬U_a(c_i) ∧ U_a(c_j)) F ¬U_a(c_j)
53.             } given i ≠ j ∈ N)
54.         END FOR
55.     END FOR
56.     
57.     RETURN combinations
58. END FUNCTION
</Pseudocode>
</Line_1>

<Line_2-4>
<Info>
2. for x ∈ C^abs**
3.     if Context(C_x^abs) ≠ ∅**
4.         U^abs = U^abs ∪ (C_x^abs, context_x, U_x^rel)**
</Info>

<Pseudocode>
<Pseudocode(A):Data_Structure>
 1. // Helper function to normalize text for consistent hashing.
 2. FUNCTION NormalizeText(STRING text)
 3.     RETURN text.Trim().ToLower().CollapseWhitespace()
 4. END FUNCTION
 5.  
 6. // (Hazard, ControlAction, Controller, AbstractedCombination, StructuredContext classes remain the same)
 7.  
 8. CLASS UnsafeCombination (UCCA)
 9.     STRING UCCA_ID                        // The unique key, potentially salted after a collision.
10.     AbstractedCombination SourceCombination
11.     StructuredContext Context
12.     LIST<Hazard> LinkedHazards
13.     LIST<ControlAction> RelevantActions
14.     STRING AnalystID
15.     DATETIME Timestamp
16.  
17.     // **ENHANCEMENT**: Now accepts an optional salt for collision recovery.
18.     FUNCTION GenerateUniqueKey(STRING salt = "")
19.         STRING contextWhen = NormalizeText(Context.When)
20.         STRING contextWhy = NormalizeText(Context.WhyUnsafe)
21.         STRING contextConstraint = NormalizeText(Context.ConstraintViolated)
22.  
23.         STRING contextKey = HASH(contextWhen + contextWhy + contextConstraint)
24.         STRING hazardsKey = GENERATE_KEY_FROM_SORTED_LIST(LinkedHazards.GetIDs())
25.         STRING actionsKey = GENERATE_KEY_FROM_SORTED_LIST(RelevantActions.GetIDs())
26.  
27.         RETURN HASH(SourceCombination.ID + contextKey + hazardsKey + actionsKey + salt)
28.     END FUNCTION
29.  
30.     // **ENHANCEMENT**: IsEqualTo now includes the ConstraintViolated field for parity with the key.
31.     FUNCTION IsEqualTo(UCCA otherUCCA)
32.         BOOL sourceMatch = (this.SourceCombination.ID == otherUCCA.SourceCombination.ID)
33.         BOOL contextMatch = (NormalizeText(this.Context.When) == NormalizeText(otherUCCA.Context.When) AND
34.                              NormalizeText(this.Context.WhyUnsafe) == NormalizeText(otherUCCA.Context.WhyUnsafe) AND
35.                              NormalizeText(this.Context.ConstraintViolated) == NormalizeText(otherUCCA.Context.ConstraintViolated))
36.         BOOL hazardsMatch = ARE_SETS_EQUAL(this.LinkedHazards.GetIDs(), otherUCCA.LinkedHazards.GetIDs())
37.         BOOL actionsMatch = ARE_SETS_EQUAL(this.RelevantActions.GetIDs(), otherUCCA.RelevantActions.GetIDs())
38.  
39.         RETURN sourceMatch AND contextMatch AND hazardsMatch AND actionsMatch
40.     END FUNCTION
41. END CLASS
42.  
43. // **NEW**: A dedicated result class to make the workflow explicit.
44. CLASS ReviewResult
45.     BOOL IsUnsafe, IsSafe, IsDeferred
46.     LIST<UCCA> UCCAs
47.     SafeReviewedCombination SafeCombination
48. END CLASS
</Pseudocode(A):Data_Structure>
<Pseudocode(B):Identify_Unsafe_Combinations>
 1. //======================================================================
 2. // FUNCTION: IdentifyUnsafeCombinations (Final Version)
 3. // PURPOSE: Orchestrates the complete human-in-the-loop process with all
 4. //          enhancements, including the corrected bulk-triage logic.
 5. //======================================================================
 6. FUNCTION IdentifyUnsafeCombinations (LIST<AbstractedCombination> potentialCombinations, LIST<Hazard> projectHazards, STRING currentAnalystID)
 7.     // --- Initialize Data Stores ---
 8.     LIST<UnsafeCombination> identifiedUCCAs = NEW LIST()
 9.     LIST<SafeReviewedCombination> safeCombinations = NEW LIST()
10.     MAP<STRING, UCCA> uccaMap = NEW MAP()
11.     SET<STRING> reviewedCombinationIDs = NEW SET()
12.  
13.     // --- Main UI Initialization ---
14.     UI.DisplayUCCAAnalysisDashboard(potentialCombinations, identifiedUCCAs, safeCombinations)
15.  
16.     // --- 1. Bulk Triage Path (Corrected Logic) ---
17.     // The UI dashboard allows the analyst to multi-select rows and apply a "Mark Selected as Safe" action.
18.     LIST<AbstractedCombination> combinationsToBulkMarkSafe = UI.GetBulkSafeSelections()
19.     
20.     FOR EACH combo IN combinationsToBulkMarkSafe
21.         SafeReviewedCombination safeCombo = NEW SafeReviewedCombination()
22.         safeCombo.SourceCombination = combo
23.         safeCombo.AnalystID = currentAnalystID
24.         safeCombo.Timestamp = GetCurrentTimestamp()
25.         safeCombo.Justification = "Marked safe in bulk triage."
26.         
27.         safeCombinations.Add(safeCombo)
28.         
29.         // **CORRECTION**: Add the combo ID to the reviewed set to prevent it from
30.         // reappearing for individual review later in this session.
31.         reviewedCombinationIDs.Add(combo.ID)
32.     END FOR
33.     
34.     // Refresh the dashboard to reflect the updated status of bulk-reviewed items.
35.     IF combinationsToBulkMarkSafe IS NOT EMPTY
36.         UI.RefreshDashboard()
37.     END IF
38.  
39.     // --- 2. Individual Review Path ---
40.     // Loop through every potential combination for detailed analysis.
41.     FOR EACH combination IN potentialCombinations
42.         // Skip any combination that was already processed via the bulk action.
43.         IF reviewedCombinationIDs.Contains(combination.ID)
44.             CONTINUE LOOP
45.         END IF
46.  
47.         // Prompt the analyst for a detailed review of the specific combination.
48.         ReviewResult result = UI.PromptForAnalysis(combination, projectHazards, currentAnalystID, uccaMap)
49.  
50.         IF result.IsUnsafe
51.             // Add any newly defined UCCAs to the master list and the key map.
52.             FOR EACH ucca IN result.UCCAs
53.                 identifiedUCCAs.Add(ucca)
54.                 uccaMap.Put(ucca.UCCA_ID, ucca)
55.             END FOR
56.             reviewedCombinationIDs.Add(combination.ID)
57.             UI.UpdateCombinationStatus(combination.ID, "Reviewed - Unsafe")
58.         ELSE IF result.IsSafe
59.             // Add the explicitly marked-safe combination to the safe list.
60.             safeCombinations.Add(result.SafeCombination)
61.             reviewedCombinationIDs.Add(combination.ID)
62.             UI.UpdateCombinationStatus(combination.ID, "Reviewed - Safe")
63.         // If the result is IsDeferred, the combination remains pending, and no status is updated.
64.         END IF
65.     END FOR
66.  
67.     RETURN (identifiedUCCAs, safeCombinations)
68. END FUNCTION
</Pseudocode(B):Identify_Unsafe_Combinations>
<Pseudocode(C):UI_Screen>
 1. CLASS UI
 2.     // ... (Dashboard display methods) ...
 3.  
 4.     STATIC FUNCTION PromptForAnalysis(AbstractedCombination combo, LIST<Hazard> hazards, STRING analystID, MAP<STRING, UCCA> existingUCCAMap)
 5.         LIST<UCCA> identifiedUCCAsForThisCombo = NEW LIST()
 6.  
 7.         WHILE TRUE
 8.             // ... (Display logic for the combination) ...
 9.             
10.             // **ENHANCEMENT**: Clearer button labels for an explicit workflow.
11.             STRING userAction = ShowButtons(["Add Unsafe Context", "Mark as Safe", "Cancel / Return"])
12.  
13.             IF userAction == "Cancel / Return"
14.                 // **ENHANCEMENT**: Return deferred status to keep item pending.
15.                 RETURN NEW ReviewResult(IsDeferred=TRUE, UCCAs=identifiedUCCAsForThisCombo)
16.  
17.             ELSE IF userAction == "Mark as Safe"
18.                 // ... (Logic for creating and returning a SafeReviewedCombination) ...
19.                 
20.             ELSE IF userAction == "Add Unsafe Context"
21.                 // ... (Logic to gather context, hazards, relevantActions, including validation hook) ...
22.  
23.                 UCCA tempUCCA = NEW UnsafeCombination()
24.                 // ... (Populate tempUCCA with user input) ...
25.                 
26.                 STRING newKey = tempUCCA.GenerateUniqueKey()
27.                 
28.                 // **ENHANCEMENT**: Full De-duplication and Hash Collision Handling.
29.                 IF existingUCCAMap.ContainsKey(newKey)
30.                     UCCA existingUCCA = existingUCCAMap.Get(newKey)
31.                     
32.                     IF tempUCCA.IsEqualTo(existingUCCA) // Deep comparison
33.                         ShowAlertDialog("Duplicate Context: This exact context already exists.")
34.                         CONTINUE LOOP // Prevent saving duplicate.
35.                     ELSE
36.                         // HASH COLLISION DETECTED
37.                         LOG_WARNING("Hash collision detected on key: " + newKey + ". Attempting auto-recovery with salt.")
38.                         
39.                         // **ENHANCEMENT**: Auto-recovery attempt.
40.                         STRING saltedKey = tempUCCA.GenerateUniqueKey(salt="_collision_retry_1")
41.                         
42.                         IF existingUCCAMap.ContainsKey(saltedKey)
43.                             // Collision on the salted key is astronomically rare and requires manual intervention.
44.                             ShowCriticalError("CRITICAL ERROR: Unrecoverable hash collision. Please contact system administrator.")
45.                             LOG_ERROR("Unrecoverable hash collision on salted key: " + saltedKey)
46.                             CONTINUE LOOP // Halt this save.
47.                         ELSE
48.                             newKey = saltedKey // Use the salted key for this UCCA.
49.                         END IF
50.                     END IF
51.                 END IF
52.  
53.                 // If we passed the checks, finalize and add the UCCA.
54.                 tempUCCA.UCCA_ID = newKey
55.                 tempUCCA.AnalystID = analystID
56.                 tempUCCA.Timestamp = GetCurrentTimestamp()
57.                 identifiedUCCAsForThisCombo.Add(tempUCCA)
58.                 
59.                 // Add key to the map immediately to prevent duplicates within the same session.
60.                 existingUCCAMap.Put(newKey, tempUCCA)
61.                 
62.                 ShowSuccessMessage("Unsafe context added.")
63.             END IF
64.         END WHILE
65.     END FUNCTION
66. END CLASS
</Pseudocode(C):UI_Screen>
</Pseudocode>
</Line_2-4>
<Line_5-6>
<Info>
5. for x ∈ U^abs*
6.     C_x^ref ← Refine-Combinations(U_x^abs, A, S) // [Equation (17)]*
</Info>

<Pseudocode>
  1. /***************************************************************************************************
  2. *
  3. * DEFINITIVE DATA STRUCTURE DEFINITIONS
  4. *
  5. ****************************************************************************************************/
  6.  
  7. // Defines the authority mapping for the collaborative system. (Cross-ref: Thesis Alg. 1 Input A)
  8. STRUCTURE AuthorityTuple
  9.     STRING_LIST Controllers
 10.     STRING_LIST ControlActions
 11.     BOOLEAN_MATRIX AuthorityMatrix
 12. END STRUCTURE
 13.  
 14. // Defines a special interaction rule. (Cross-ref: Thesis Alg. 1 Input S)
 15. STRUCTURE SpecialInteractionRule
 16.     STRING_LIST InputControlActions
 17.     STRING InputVerb
 18.     STRING RuleLogic
 19.     STRING OutputVerb
 20. END STRUCTURE
 21.  
 22. // Represents a high-level, abstracted UCCA.
 23. STRUCTURE AbstractUCCA
 24.     INTEGER Id
 25.     STRING AbstractionType
 26.     STRING UCCAType
 27.     STRING_LIST AbstractControllers
 28.     STRING_LIST AbstractActions
 29.     STRING_LIST Verbs
 30.     STRING Context
 31.     STRING_LIST RelevantActions
 32. END STRUCTURE
 33.  
 34. ENUM TemporalVerb { START, END }
 35.  
 36. // NOTE: AFTER and OVERLAP are included for future expansion and are not used by the current algorithm.
 37. ENUM TemporalRelation { BEFORE, AFTER, OVERLAP }
 38.  
 39. STRUCTURE TemporalEvent
 40.     STRING Controller
 41.     STRING Action
 42.     TemporalVerb Verb
 43.     INTEGER SequencePosition
 44. END STRUCTURE
 45.  
 46. STRUCTURE RefinedUCCA
 47.     STRING Id
 48.     // For T12, this is a MAP<STRING, STRING> (StateCombination).
 49.     // For T34, this is a TEMPORAL_EVENT_LIST (TemporalSequence).
 50.     VARIANT Combination
 51.     TemporalRelation Relation // Populated for T34 UCCAs.
 52.     STRING Context
 53. END STRUCTURE
 54.  
 55. // ... (Main function RefineAllAbstractUCCAs and the dispatcher RefineSingleUCCA remain unchanged) ...
 56.  
 57. /***************************************************************************************************
 58. *
 59. * REFINEMENT HELPER FUNCTIONS
 60. *
 61. ****************************************************************************************************/
 62.  
 63. // ... (RefineType12_Abs2a, RefineType12_Abs2b, RefineType34_Abs2a, RefineType34_Abs2b remain unchanged) ...
 64.  
 65.  
 66. /***************************************************************************************************
 67. *
 68. * UTILITY FUNCTIONS
 69. *
 70. ****************************************************************************************************/
 71.  
 72. FUNCTION ParseTemporalVerb(STRING verbString) -> TemporalVerb
 73.     // Provides robust, fail-fast parsing of verb strings.
 74.     IF verbString == "starts" THEN RETURN TemporalVerb.START
 75.     ELSE IF verbString == "ends" THEN RETURN TemporalVerb.END
 76.     ELSE
 77.         THROW InvalidTemporalVerbException("Unknown verb: '" + verbString + "'. Must be 'starts' or 'ends'.")
 78.     END IF
 79. END FUNCTION
 80.  
 81. FUNCTION DetermineUccaCategory(STRING_LIST verbs) -> STRING
 82.     // This helper must be robust to verb order.
 83.     
 84.     INTEGER providesCount = verbs.count("provides")
 85.     INTEGER notProvidesCount = verbs.count("not_provides")
 86.  
 87.     // FIX: Added assertion to fail-fast on malformed input.
 88.     ASSERT (providesCount + notProvidesCount) == verbs.size() AND verbs.size() == 2, "DetermineUccaCategory expects a list of exactly two 'provides'/'not_provides' verbs."
 89.  
 90.     IF providesCount == 0
 91.         RETURN "gap"
 92.     ELSE IF providesCount == 1
 93.         RETURN "mismatch"
 94.     ELSE // providesCount > 1
 95.         RETURN "overlap"
 96.     END IF
 97. END FUNCTION
 98.  
 99. FUNCTION GenerateAllConcreteCombinations(AuthorityTuple authority) -> ITERABLE<CONCRETE_COMBINATION>
100.     // Implements the set P from Eq. (17). (Cross-ref: Thesis, pg. 104)
101.     // NOTE: This should be implemented as a generator/iterator to keep memory usage flat for large systems.
102.     // The implementation MUST only generate combinations where a "provides" verb is used if
103.     // authority.AuthorityMatrix allows it, preventing the creation of infeasible states.
104.     // ...
105. END FUNCTION
106.  
107. // ... (Other utility functions like GetCanonicalSignature, etc.) ...
108.  
109. /***************************************************************************************************
110. *
111. * SUGGESTED UNIT TESTS
112. * A comprehensive test harness would validate the algorithm's core properties:
113. *
114. * 1. Jam-Interference Rule Test: Confirms that a special interaction rule correctly maps a concrete
115. * overlap to a collective "gap" for both Abstraction 2a and 2b UCCAs.
116. *
117. * 2. RelevantActions Filter Test: A property-based test confirming that adding an irrelevant
118. * control action to an abstract UCCA's definition has zero impact on the final set of
119. * refined UCCAs.
120. *
121. * 3. Interchangeable Pruning Test: Confirms that for any pair of interchangeable controllers
122. * (c_i, c_j), a refined combination and its commuted version appear exactly once.
123. *
124. * 4. Pruning Fuzz Test: A property-based test that generates random controller groups and
125. * interchangeable sets, then asserts that no two items in the pruned output map to the
126. * same canonical signature, ensuring the pruning logic is robust.
127. *
128. ****************************************************************************************************/
</Pseudocode>
</Line_5-6>

<Line_7>
<Info>
7.     C_x^ref' ← Prune-Equivalent(C_x^ref, C^int) // [Equation (21)]*
</Info>

<Pseudocode>
  1. /***************************************************************************************************
  2. *  MODULE: UCCA_RefineAndPrune
  3. *
  4. *  Implements Algorithm 1 (Chapter 4 of Kopeikin PhD thesis) — Lines 5-7
  5. *  -------------------------------------------------------------------
  6. *     • Line 5   — iterate over each abstract UCCA (done in caller)
  7. *     • Line 6   — RefineCombinations   (Eq. 17)  → Cxref
  8. *     • Line 7   — PruneEquivalentCombinations (Eq. 21) → Cxref'
  9. *
 10. *  Scope
 11. *  -----
 12. *  • Supports Type 1-2 UCCAs (simultaneous “provide / not-provide” cases).
 13. *  • Type 3-4 (temporal permutations) is SAFELY GUARDED with NotImplementedException.
 14. *
 15. *  Complexity
 16. *  ----------
 17. *  • Refinement   : O( 2P ) where P = authorised (controller,action) pairs.
 18. *  • Pruning      : O( M ) where M = |Cxref|  (canonical-signature hash).
 19. *
 20. *  Key symbols (directly from thesis):
 21. *     A   = AuthorityTuple (N, M, A_matrix)
 22. *     S   = set of special-interaction rules (tuple ⟨U, Tin, Σ, Tout⟩)
 23. *     Cint= set of interchangeable-controller groups
 24. ***************************************************************************************************/
 25.  
 26.  
 27.  
 28. /*──────────────────────────── LINE 6 — REFINEMENT ───────────────────────────*/
 29.  
 30. FUNCTION RefineCombinations(abstractedUcca, authorityTuple, specialInteractions)
 31.     /*
 32.      * Returns Set<RefinedUCCA>  (Cxref_x in thesis)
 33.      * Implements Eq. (17):  ⋃ {Pe | Pe′ ≡ Uabs′ }
 34.      */
 35.     primitiveSpace ← GeneratePrimitiveCombinations(authorityTuple,
 36.                                                    abstractedUcca.getType())
 37.  
 38.     refined ← new Set()
 39.  
 40.     FOR EACH primitive IN primitiveSpace
 41.         IF abstractedUcca.isType34() THEN
 42.             collective ← CalculateUnionOfEfforts(primitive)                // 𝓢 ignored
 43.         ELSE
 44.             collective ← ApplySpecialInteractions(primitive, specialInteractions)
 45.         END IF
 46.  
 47.         IF IsEquivalentToAbstractedUCCA(collective, abstractedUcca) THEN
 48.             refined.add(primitive)
 49.         END IF
 50.     END FOR
 51.  
 52.     RETURN refined
 53. END FUNCTION
 54.  
 55.  
 56.  
 57. /*───────────────────────── Primitive-space generator ───────────────────────*/
 58.  
 59. FUNCTION GeneratePrimitiveCombinations(authorityTuple, uccaType)
 60.     IF uccaType == TYPE_1_2 THEN
 61.         authorisedPairs ← authorityTuple.getAuthorisedPairs()              // (ci,aj)
 62.         primitiveSet   ← new Set()
 63.         limit          ← 2^(authorisedPairs.length)                        // bitmask loop
 64.  
 65.         FOR mask = 0 TO limit-1
 66.             pc ← new RefinedUCCA()
 67.             FOR idx = 0 TO authorisedPairs.length-1
 68.                 pair       ← authorisedPairs[idx]
 69.                 isProvided ← ((mask >> idx) & 1) == 1
 70.                 pc.setEffort(pair.controller, pair.action, isProvided)
 71.             END FOR
 72.             primitiveSet.add(pc)
 73.         END FOR
 74.  
 75.         RETURN primitiveSet                                                  // 2P combos
 76.  
 77.     ELSE IF uccaType == TYPE_3_4 THEN
 78.         THROW new NotImplementedException(
 79.               "Temporal permutation generation for Type 3-4 UCCAs not yet implemented. " +
 80.               "See thesis §4.2.3, Eq.(19-20) for algorithmic requirements.")
 81.     END IF
 82. END FUNCTION
 83.  
 84.  
 85.  
 86. /*──────────────────────────── 𝓢-rule evaluator ─────────────────────────────*/
 87.  
 88. FUNCTION ApplySpecialInteractions(primitiveCombination, specialInteractionRules)
 89.     /*
 90.      * Each rule S = ⟨U, Tin, Σ, Tout⟩
 91.      * Tin  — input effort pattern
 92.      * Σ    — predicate
 93.      * Tout — rewritten collective output
 94.      */
 95.     collective ← CalculateUnionOfEfforts(primitiveCombination)
 96.  
 97.     FOR EACH rule IN specialInteractionRules
 98.         IF rule.appliesTo(primitiveCombination) THEN
 99.             collective ← rule.transform(collective)
100.         END IF
101.     END FOR
102.     RETURN collective
103. END FUNCTION
104.  
105.  
106.  
107. /*───────────────────────── Abstract-vs-collective test ─────────────────────*/
108.  
109. FUNCTION IsEquivalentToAbstractedUCCA(collectiveOutput, abstractedUcca)
110.     relevant ← abstractedUcca.getRelevantActions()
111.  
112.     // Early rejection
113.     IF NOT collectiveOutput.hasAllActions(relevant) THEN RETURN FALSE
114.  
115.     FOR EACH action IN relevant
116.         IF abstractedUcca.isProvided(action) ≠ collectiveOutput.isProvided(action) THEN
117.             RETURN FALSE
118.         END IF
119.     END FOR
120.     RETURN TRUE
121. END FUNCTION
122.  
123.  
124.  
125. /*──────────────────────── LINE 7 — PRUNING (O(M)) ──────────────────────────*/
126.  
127. FUNCTION PruneEquivalentCombinations(refinedUccaSet, interchangeableControllerSets)
128.     controllerToSet ← buildControllerToSetMap(interchangeableControllerSets)
129.  
130.     unique   ← new Set()
131.     seenHash ← new Set()
132.     ordered  ← convertSetToSortedList(refinedUccaSet)       // deterministic output
133.  
134.     FOR EACH ucca IN ordered
135.         sig ← GenerateCanonicalSignature(ucca, controllerToSet)
136.         IF NOT seenHash.contains(sig) THEN
137.             seenHash.add(sig)
138.             unique.add(ucca)
139.         END IF
140.     END FOR
141.     RETURN unique                                           // Cxref'
142. END FUNCTION
143.  
144.  
145.  
146. /*──────────── Canonical signature  (implements thesis Eq. 21) ──────────────*/
147.  
148. FUNCTION GenerateCanonicalSignature(ucca, controllerToSetMap)
149.     /*
150.      * Eq. 21 equivalence:
151.      *   1) swap efforts of any c_i,c_j ∈ same Cint_z
152.      *   2) others identical
153.      * → We sort efforts *within* each interchangeable set and
154.      *   list non-interchangeables verbatim → identical hashes for equivalents.
155.      */
156.     nonInt  ← new List()
157.     intSets ← new Map()      // groupID → List<string>
158.  
159.     FOR EACH ctrl IN ucca.getAllControllers()
160.         vector ← GetControlEfforts(ucca, ctrl).toString()
161.         IF controllerToSetMap.hasKey(ctrl) THEN
162.             gid ← controllerToSetMap.get(ctrl).getID()
163.             intSets.setdefault(gid, new List()).add(vector)
164.         ELSE
165.             nonInt.add(ctrl + ":" + vector)
166.         END IF
167.     END FOR
168.  
169.     sort(nonInt)                                     // α-order for determinism
170.     groupStrings ← new List()
171.     FOR EACH gid IN intSets.getKeys().sort()
172.         list ← intSets[gid]; sort(list)              // sort efforts in group
173.         groupStrings.add("G" + gid + ":" + list.join("|"))
174.     END FOR
175.  
176.     RETURN nonInt.join(";") + ";" + groupStrings.join(";")
177. END FUNCTION
178.  
179.  
180.  
181. /*─────────────────────────── Helper utilities ─────────────────────────────*/
182.  
183. FUNCTION buildControllerToSetMap(interchangeableSets)
184.     map ← new Map()
185.     id  ← 0
186.     FOR EACH s IN interchangeableSets
187.         FOR EACH c IN s
188.             map[c] = { set: s, id: id }
189.         END FOR
190.         id += 1
191.     END FOR
192.     RETURN map
193. END FUNCTION
194.  
195. FUNCTION GetControlEfforts(ucca, controllerID)
196.     RETURN ucca.efforts[controllerID]          // thin accessor
197. END FUNCTION
</Pseudocode>
</Line_7>

<Line_8-9>
<Info>
8.     U_x^ref ← Prioritize(C_x^ref', S) // [Heuristic, see discussion]*
9. return (U^abs, U^ref)*

</Info>

<Pseudocode>
  1. // Main algorithm entry point.
  2. ALGORITHM UCCA_Identification(
  3.     IN authority_tuple,
  4.     IN interchangeable_controllers,
  5.     IN special_interactions,
  6.     IN enable_prioritization = TRUE // Optional flag to control prioritization flow.
  7. )
  8.     // ... Lines 1-7 of Algorithm 1 are executed first to produce ...
  9.     // 1. abstracted_uccas: A set of UCCA tuples.
 10.     // 2. refined_and_pruned_uccas_map: A map where each key is an abstracted UCCA and its
 11.     //    value is the corresponding set of refined and pruned UCCAs (C_x_ref').
 12.  
 13.     // This map holds the final output. The name reflects that its contents
 14.     // may be unordered if prioritization is disabled.
 15.     LET final_refined_uccas_map = NEW MAP()
 16.  
 17.     // Corresponds to the loop starting at Line 5 of the source algorithm.
 18.     FOR EACH abstracted_ucca IN abstracted_uccas:
 19.         LET C_x_ref_prime = refined_and_pruned_uccas_map.get(abstracted_ucca)
 20.         LET U_x_ref // This will hold the final output structure for this iteration.
 21.  
 22.         // =================================================================
 23.         // FINAL PSEUDOCODE FOR LINE 8: Automated Prioritization
 24.         // =================================================================
 25.         IF enable_prioritization THEN
 26.             // Prioritization is enabled; call the function.
 27.             U_x_ref = Prioritize(C_x_ref_prime, special_interactions, abstracted_ucca)
 28.         ELSE
 29.             // When disabled, the ordered_view is NULL, indicating original set order.
 30.             U_x_ref = { set: C_x_ref_prime, ordered_view: NULL }
 31.         END IF
 32.  
 33.         final_refined_uccas_map.put(abstracted_ucca, U_x_ref)
 34.  
 35.     // =================================================================
 36.     // FINAL PSEUDOCODE FOR LINE 9: Automated Output
 37.     // =================================================================
 38.     RETURN (abstracted_uccas, final_refined_uccas_map)
 39.  
 40. END ALGORITHM
 41.  
 42. //----------------------------------------------------------------------------------
 43. // FINAL PRIORITIZE FUNCTION (ALGORITHM 1, LINE 8)
 44. //----------------------------------------------------------------------------------
 45. FUNCTION Prioritize(
 46.     IN C_x_ref_prime,              // The refined, pruned UCCA set.
 47.     IN special_interactions,       // The set S.
 48.     IN abstracted_ucca             // The parent abstracted UCCA.
 49. )
 50.     // Implements the heuristic from the thesis.
 51.     //
 52.     // RETURNS: A structure containing:
 53.     //  - {set}: The original, unordered set of UCCAs (C_x_ref_prime).
 54.     //  - {ordered_view}: A list of the UCCAs with human-readable priority labels,
 55.     //    sorted for presentation purposes. The ordering does not change the semantic
 56.     //    nature of the output, which is still a set (𝓤ᵣᵉᶠ).
 57.  
 58.     LET temp_list = NEW LIST()
 59.     LET abstraction_type = abstracted_ucca.type
 60.  
 61.     FOR EACH ucca IN C_x_ref_prime:
 62.         LET priority_level = 1 // Default: High
 63.  
 64.         // --- Precedence Rule 1: Special Interactions (S) ---
 65.         // S rules have the highest precedence.
 66.         // If multiple S rules match, choose the rule with the lowest numeric_priority (highest importance).
 67.         LET special_priority = NULL
 68.         FOR EACH interaction IN special_interactions:
 69.             IF DoesInteractionApply(ucca, interaction) THEN
 70.                 IF special_priority == NULL OR interaction.priority_level < special_priority THEN
 71.                     special_priority = interaction.priority_level
 72.                 END IF
 73.             END IF
 74.         END FOR
 75.  
 76.         IF special_priority != NULL THEN
 77.             priority_level = special_priority
 78.         ELSE
 79.             // --- Precedence Rule 2: Default Heuristics ---
 80.             // Heuristic 1: Single controller cases are lowest priority.
 81.             IF GetActiveControllerCount(ucca) == 1 THEN
 82.                 priority_level = 4 // Lowest
 83.             ELSE
 84.                 action_counts = GetActionCounts(ucca)
 85.                 // Heuristic 2: Abstraction 2a defaults duplicates (>=2) to low priority.
 86.                 // Exceptions must be handled by an S rule to be promoted.
 87.                 IF abstraction_type == "Abstraction 2a" AND any count in action_counts >= 2 THEN
 88.                     priority_level = 3 // Low
 89.                 // Heuristic 3: Abstraction 2b demotes triplicates (>=3) or more.
 90.                 ELSE IF abstraction_type == "Abstraction 2b" AND any count in action_counts >= 3 THEN
 91.                     priority_level = 3 // Low
 92.                 END IF
 93.             END IF
 94.         END IF
 95.         ADD {ucca: ucca, numeric_priority: priority_level} TO temp_list
 96.  
 97.     sorted_list = SortBy(temp_list, "numeric_priority", ASCENDING)
 98.  
 99.     LET ordered_view_with_labels = NEW LIST()
100.     FOR EACH item IN sorted_list:
101.         ADD {ucca: item.ucca, priority: MapPriorityToString(item.numeric_priority)} TO ordered_view_with_labels
102.     END FOR
103.  
104.     RETURN { set: C_x_ref_prime, ordered_view: ordered_view_with_labels }
105.  
106. END FUNCTION
107.  
108. //----------------------------------------------------------------------------------
109. // HELPER FUNCTION for mapping numeric priorities to strings.
110. //----------------------------------------------------------------------------------
111. // This mapping makes the output more intuitive for analysts.
112. // Mapping: 1 -> "High", 2 -> "Medium", 3 -> "Low", 4 -> "Lowest"
113. FUNCTION MapPriorityToString(IN numeric_priority)
114.     SWITCH numeric_priority:
115.         CASE 1: RETURN "High"
116.         CASE 2: RETURN "Medium"
117.         CASE 3: RETURN "Low"
118.         CASE 4: RETURN "Lowest"
119.         DEFAULT: RETURN "Undefined"
120.     END SWITCH
121. END FUNCTION
122.  
123. //----------------------------------------------------------------------------------
124. // IMPLEMENTATION NOTES
125. //----------------------------------------------------------------------------------
126. // **Unit Testing:** A robust test suite is critical for this algorithm.
127. // 1.  **Optionality Test:** Run the main algorithm twice on the same input, once with
128. //     `enable_prioritization = TRUE` and once with `FALSE`. Assert that the output `set` is
129. //     identical in both runs and that `ordered_view` is `NULL` only when the flag is `FALSE`.
130. // 2.  **Heuristic Validation:**
131. //     - Use the refined UCCAs from the MUM-T case study's **Table 5-5** as a test fixture.
132. //     - Create a special interaction rule for the "two fix" case: `IF action_counts['fix'] == 2 THEN priority = 2`.
133. //     - Assert that UCCA 10.5.4 is correctly assigned "Medium" (Priority 2).
134. //     - Assert that UCCA 10.5.1 and 10.5.2 are assigned "High" (Priority 1).
135. //     - Assert that UCCA 10.5.3, 10.5.5, and 10.5.6 are assigned "Low" (Priority 3).
136. // 3.  **Special Interaction Precedence:** Create a test for a single-controller UCCA. Without an `S`
137. //     rule, assert its priority is "Lowest". With an `S` rule that promotes it to priority 1, assert
138. //     its priority is "High".

</Pseudocode>
</Line_8-9>
