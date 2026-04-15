"""
LLM Interface - Stateless LLM Integration

Bridges Atlantean fields with LLM responses without storing conversation history.
"""

from typing import Optional


def call_llm_with_context(
    user_input: str,
    hot_memory,
    llm_function=None
) -> str:
    """
    Call LLM with Atlantean context but no conversation history.
    
    Args:
        user_input: User's query/message
        hot_memory: Current intelligence fields
        llm_function: LLM call function (optional)
    
    Returns:
        LLM response
    """
    # Get field context
    context = _build_context(hot_memory)
    
    # Build prompt with context
    system_prompt = f"""You are Quadra Seer Intelligence, powered by Atlantean Core.

Current Intelligence State:
{context}

You maintain zero conversation history - each interaction is fresh.
However, your field state (shown above) contains learned patterns from past interactions.

Respond naturally and helpfully to the user."""
    
    full_prompt = f"{system_prompt}\n\nUser: {user_input}"
    
    if llm_function:
        return llm_function(full_prompt)
    else:
        # Fallback mock response
        return f"[Atlantean Ready] {user_input}\n\nField Context:\n{context}"


def _build_context(hot_memory) -> str:
    """Build natural language context from field states."""
    stats = hot_memory.get_stats()
    
    phi1_mean = stats['phi1_mean']
    phi5_mean = stats['phi5_mean']
    phi_value = stats['Phi']
    
    context_parts = []
    
    # Decision field interpretation
    if phi1_mean > 0.5:
        context_parts.append("• Operating with high confidence and clear direction")
    elif phi1_mean > 0.2:
        context_parts.append("• Moderately confident, steadily improving")
    elif phi1_mean > -0.2:
        context_parts.append("• Balanced state, exploring possibilities")
    else:
        context_parts.append("• In learning mode, gathering information")
    
    # Plasticity field interpretation
    if phi5_mean > 0.7:
        context_parts.append("• High learning capacity - actively adapting to new patterns")
    elif phi5_mean > 0.4:
        context_parts.append("• Moderate plasticity - integrating new knowledge")
    else:
        context_parts.append("• Low plasticity - patterns consolidating")
    
    # Global coherence
    if phi_value > 0.7:
        context_parts.append("• Strong internal coherence - unified decision-making")
    elif phi_value > 0.3:
        context_parts.append("• Moderate coherence - coordinating multiple aspects")
    else:
        context_parts.append("• Low coherence - exploring conflicting directions")
    
    return "\n".join(context_parts)
