import { ReactNode } from 'react';

export const hazardInfoContent = (
    <>
        <p>As an example, consider a nuclear power plant. A release of radioactive materials, the proximity of a nearby population or city, and the direction of the wind may all be important factors that lead to a potential loss of life. However, as engineers we cannot control the wind and we may not be able to control the city location, but we can control the release of radioactive materials in or outside the plant (a system-level hazard).</p>
        <p>Once the system and system boundary is identified, the next step is to define the system-level hazards by identifying system states or conditions that will lead to a loss in worst-case environmental conditions. The following list provides some examples of system-level hazards:</p>
        <ul>
            <li>H-1: Aircraft violate minimum separation standards in flight [L-1, L-2, L-4, L-5]</li>
            <li>H-2: Aircraft airframe integrity is lost [L-1, L-2, L-4, L-5]</li>
            <li>H-3: Aircraft leaves designated taxiway, runway, or apron on ground [L-1, L-2, L-5]</li>
            <li>H-4: Aircraft comes too close to other objects on the ground [L-1, L-2, L-5]</li>
            <li>H-8: Nuclear power plant releases dangerous materials [L-1, L-4, L-7, L-8]</li>
        </ul>
        <p>There are three basic criteria for defining system-level hazards:</p>
        <ul>
            <li>Hazards are system states or conditions (not component-level causes or environmental states)</li>
            <li>Hazards will lead to a loss in some worst-case environment</li>
            <li>Hazards must describe states or conditions to be prevented</li>
        </ul>
        <h4>Common mistakes when identifying system-level hazards</h4>
        <h5>Confusing hazards with causes of hazards</h5>
        <p>A common mistake in defining hazards is to confuse hazards with causes of hazards. For example, “brake failure”, “brake failure not annunciated”, “operator is distracted”, “engine failure”, and “hydraulic leak” are not system-level hazards but potential causes of hazards. To avoid this mistake, make sure the identified hazards do not refer to individual components of the system, like brakes, engines, hydraulic lines, etc. Instead, the hazards should refer to the overall system and system states.</p>
        <h5>Too many hazards containing unnecessary detail</h5>
        <p>Like losses, there are no hard limits on the number of system-level hazards to include. As a rule of thumb, if you have more than about seven to ten system-level hazards, consider grouping or combining hazards to create a more manageable list.</p>
        <h5>Ambiguous or recursive wording</h5>
        <p>The system-level hazards define exactly what “unsafe” means at the system level. A common mistake is to use the word “unsafe” in the hazards themselves. Doing so creates a recursive definition and does not add information or value to the analysis. A simple solution is to avoid using the word “unsafe” in the hazard itself and instead specify exactly what is meant by “unsafe”—what system states or conditions would make it unsafe?</p>
        <h5>Confusing hazards with failures</h5>
        <p>Hazard identification in STPA is about system states and conditions that are inherently unsafe— regardless of the cause. In fact, the system hazards should be specified at a high-enough level that does not distinguish between causes related to technical failures, design errors, flawed requirements, or human procedures and interactions.</p>
    </>
);

export const subHazardInfoContent: ReactNode = (
    <>
        <h4>Refining the system-level hazards (optional)</h4>
        <p>
            Once the list of system-level hazards has been identified and reviewed, these hazards can be refined into sub-hazards if appropriate. Sub-hazards are not necessary for many STPA applications, but they can be useful for large analysis efforts and complex applications because they can guide future steps like modeling the control structure.
        </p>
        <p>
            The first step in refining the system-level hazards is to identify basic system processes or activities that need to be controlled to prevent system hazards. For example, consider the system-level hazard we identified earlier for commercial aviation:
        </p>
        <blockquote className="border-l-4 pl-4 my-4 italic">
            <p>H-4: Aircraft comes too close to other objects on the ground [L-1, L-2, L-5]</p>
        </blockquote>
        <p>
            One way to derive sub-hazards is to ask: What do we need to control to prevent this hazard? To control the aircraft on the ground, we will need some way to control aircraft deceleration, acceleration, and steering. If these are not controlled adequately (for example if the deceleration is insufficient), it could lead to a system-level hazard.
        </p>
        <p>The following sub-hazards can be derived for H-4:</p>
        <blockquote className="border-l-4 pl-4 my-4">
            <p className="font-semibold">H-4: Aircraft comes too close to other objects on the ground [L-1, L-2, L-5]</p>
            <h5 className="font-semibold mt-2">Deceleration</h5>
            <ul className="list-disc list-inside">
                <li>H-4.1: Deceleration is insufficient upon landing, rejected takeoff, or during taxiing</li>
                <li>H-4.2: Asymmetric deceleration maneuvers aircraft toward other objects</li>
                <li>H-4.3: Deceleration occurs after V1 point during takeoff</li>
            </ul>
            <h5 className="font-semibold mt-2">Acceleration</h5>
            <ul className="list-disc list-inside">
                <li>H-4.4: Excessive acceleration provided while taxiing</li>
                <li>H-4.5: Asymmetric acceleration maneuvers aircraft toward other objects</li>
                <li>H-4.6: Acceleration is insufficient during takeoff</li>
                <li>H-4.7: Acceleration is provided during landing or when parked</li>
                <li>H-4.8: Acceleration continues to be applied during rejected takeoff</li>
            </ul>
            <h5 className="font-semibold mt-2">Steering</h5>
            <ul className="list-disc list-inside">
                <li>H-4.9: Insufficient steering to turn along taxiway, runway, or apron path</li>
                <li>H-4.10: Steering maneuvers aircraft off the taxiway, runway, or apron path</li>
            </ul>
        </blockquote>
        <p>
            Each of these sub-hazards can be used to produce more specific constraints.
        </p>
    </>
);